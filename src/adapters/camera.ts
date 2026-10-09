import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { writeBinaryFile, getFileUri, readBinaryFile } from '@/storage/files'
import { isNative, hasGetUserMedia } from '@/adapters/platform'
import { createId } from '@/utils/id'
import { trError } from '@/i18n'

export interface CapturedMedia {
  path: string
  mime: string
  size: number
  durationMs?: number
  previewUrl: string
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, body] = dataUrl.split(',')
  const mime = /data:(.*?);/.exec(meta)?.[1] || 'image/jpeg'
  const binary = atob(body)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

async function toCaptured(path: string, mime: string): Promise<CapturedMedia> {
  const blob = await readBinaryFile(path)
  return {
    path,
    mime,
    size: blob.size,
    previewUrl: isNative() ? await getFileUri(path) : URL.createObjectURL(blob),
  }
}

export async function capturePhoto(): Promise<CapturedMedia> {
  const photo = await Camera.getPhoto({
    quality: 85,
    resultType: isNative() ? CameraResultType.Uri : CameraResultType.DataUrl,
    source: CameraSource.Camera,
    saveToGallery: false,
  })

  const path = `media/photos/${createId()}.jpg`

  if (isNative() && photo.path) {
    try {
      await Filesystem.copy({
        from: photo.path,
        to: path,
        toDirectory: Directory.Data,
      })
    } catch {
      const file = await Filesystem.readFile({ path: photo.path })
      await writeBinaryFile(path, dataUrlToBlob(`data:image/jpeg;base64,${file.data}`))
    }
  } else if (photo.dataUrl) {
    await writeBinaryFile(path, dataUrlToBlob(photo.dataUrl))
  } else if (photo.webPath) {
    const res = await fetch(photo.webPath)
    await writeBinaryFile(path, await res.blob())
  } else {
    throw new Error(trError('cameraFailed'))
  }

  return toCaptured(path, 'image/jpeg')
}

export async function pickFromGallery(): Promise<CapturedMedia> {
  const photo = await Camera.getPhoto({
    quality: 90,
    resultType: isNative() ? CameraResultType.Uri : CameraResultType.DataUrl,
    source: CameraSource.Photos,
  })
  const path = `media/photos/${createId()}.jpg`

  if (photo.dataUrl) {
    await writeBinaryFile(path, dataUrlToBlob(photo.dataUrl))
  } else if (photo.webPath) {
    const res = await fetch(photo.webPath)
    await writeBinaryFile(path, await res.blob())
  } else if (photo.path) {
    const file = await Filesystem.readFile({ path: photo.path })
    await writeBinaryFile(path, dataUrlToBlob(`data:image/jpeg;base64,${file.data}`))
  }

  return toCaptured(path, 'image/jpeg')
}

async function ensureCameraPermission(): Promise<void> {
  if (!isNative()) return
  try {
    const perms = await Camera.requestPermissions({ permissions: ['camera'] })
    if (perms.camera === 'denied') throw new Error(trError('cameraPermission'))
  } catch (err) {
    if (err instanceof Error && err.message === trError('cameraPermission')) throw err
  }
}

async function attachStream(
  video: HTMLVideoElement,
  constraints: MediaStreamConstraints,
): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia(constraints)
  video.srcObject = stream
  await video.play()
  return stream
}

export async function startVideoStream(video: HTMLVideoElement): Promise<MediaStream> {
  if (!hasGetUserMedia()) throw new Error(trError('noCamera'))
  await ensureCameraPermission()

  const videoConstraints: MediaTrackConstraints = { facingMode: { ideal: 'environment' } }
  try {
    return await attachStream(video, { video: videoConstraints, audio: true })
  } catch {
    try {
      return await attachStream(video, { video: videoConstraints, audio: false })
    } catch {
      try {
        return await attachStream(video, { video: true, audio: true })
      } catch {
        try {
          return await attachStream(video, { video: true, audio: false })
        } catch {
          throw new Error(trError('cameraPermission'))
        }
      }
    }
  }
}

function pickRecorderMime(): string | undefined {
  const candidates = ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']
  return candidates.find((type) => MediaRecorder.isTypeSupported(type))
}

export function createRecorder(stream: MediaStream): {
  recorder: MediaRecorder
  stop: () => Promise<Blob>
} {
  const mime = pickRecorderMime()
  const chunks: Blob[] = []
  const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data)
  }
  recorder.start(200)

  const stop = () =>
    new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mime || recorder.mimeType || 'video/webm' }))
      if (recorder.state !== 'inactive') recorder.stop()
    })

  return { recorder, stop }
}

export async function saveVideoBlob(blob: Blob): Promise<CapturedMedia> {
  const ext = blob.type.includes('mp4') ? 'mp4' : 'webm'
  const path = `media/videos/${createId()}.${ext}`
  await writeBinaryFile(path, blob)
  return {
    path,
    mime: blob.type || `video/${ext}`,
    size: blob.size,
    previewUrl: isNative() ? await getFileUri(path) : URL.createObjectURL(blob),
  }
}

export function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop())
}
