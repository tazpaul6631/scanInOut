import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import writeBlob from 'capacitor-blob-writer'
import { trError } from '@/i18n'

const DATA_DIR = Directory.Data
const DOCS_DIR = Directory.Documents

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

async function getOpfsHandle(path: string, create: boolean) {
  const parts = path.split('/').filter(Boolean)
  const name = parts.pop()
  if (!name) throw new Error(trError('invalidPath'))
  let dir = await navigator.storage.getDirectory()
  for (const part of parts) {
    dir = await dir.getDirectoryHandle(part, { create })
  }
  return dir.getFileHandle(name, { create })
}

export function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

export async function writeTextFile(
  path: string,
  content: string,
  directory: 'data' | 'documents' = 'data',
): Promise<void> {
  if (isNative()) {
    await Filesystem.writeFile({
      path,
      data: content,
      directory: directory === 'documents' ? DOCS_DIR : DATA_DIR,
      encoding: Encoding.UTF8,
      recursive: true,
    })
    return
  }

  if (directory === 'documents') {
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = path.split('/').pop() || 'backup.json'
    a.click()
    URL.revokeObjectURL(url)
    return
  }

  const handle = await getOpfsHandle(path, true)
  const writable = await handle.createWritable()
  await writable.write(content)
  await writable.close()
}

export async function writeBinaryFile(path: string, data: Blob | Uint8Array): Promise<void> {
  const blob =
    data instanceof Blob ? data : new Blob([data.buffer as ArrayBuffer], { type: 'application/octet-stream' })

  if (isNative()) {
    try {
      await writeBlob({
        path,
        directory: DATA_DIR,
        blob,
        recursive: true,
        fast_mode: false,
      })
      return
    } catch {
      await Filesystem.writeFile({
        path,
        data: await blobToBase64(blob),
        directory: DATA_DIR,
        recursive: true,
      })
    }
    return
  }

  const handle = await getOpfsHandle(path, true)
  const writable = await handle.createWritable()
  await writable.write(blob)
  await writable.close()
}

export async function readTextFile(path: string, directory: 'data' | 'documents' = 'data'): Promise<string> {
  if (isNative()) {
    const result = await Filesystem.readFile({
      path,
      directory: directory === 'documents' ? DOCS_DIR : DATA_DIR,
      encoding: Encoding.UTF8,
    })
    return String(result.data)
  }

  const handle = await getOpfsHandle(path, false)
  const file = await handle.getFile()
  return file.text()
}

export async function readBinaryFile(path: string): Promise<Blob> {
  if (isNative()) {
    const result = await Filesystem.readFile({
      path,
      directory: DATA_DIR,
    })
    const base64 = String(result.data)
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    return new Blob([bytes])
  }

  const handle = await getOpfsHandle(path, false)
  return handle.getFile()
}

export async function deleteDiskFile(path: string): Promise<void> {
  if (isNative()) {
    await Filesystem.deleteFile({ path, directory: DATA_DIR })
    return
  }
  try {
    const parts = path.split('/').filter(Boolean)
    const name = parts.pop()
    if (!name) return
    let dir = await navigator.storage.getDirectory()
    for (const part of parts) {
      dir = await dir.getDirectoryHandle(part)
    }
    await dir.removeEntry(name)
  } catch {
    // ignore missing file
  }
}

export async function getFileUri(path: string): Promise<string> {
  if (isNative()) {
    const { uri } = await Filesystem.getUri({ path, directory: DATA_DIR })
    return Capacitor.convertFileSrc(uri)
  }
  const blob = await readBinaryFile(path)
  return URL.createObjectURL(blob)
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    if (isNative()) {
      await Filesystem.stat({ path, directory: DATA_DIR })
      return true
    }
    await getOpfsHandle(path, false)
    return true
  } catch {
    return false
  }
}

export async function persistFlag(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  return navigator.storage.persist()
}
