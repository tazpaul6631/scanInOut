import ExcelJS from 'exceljs'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'
import { saveAs } from 'file-saver'
import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

export interface ExportColumn {
  key: string
  header: string
}

async function saveNative(filename: string, data: string, encoding: Encoding = Encoding.UTF8) {
  await Filesystem.writeFile({
    path: `SRC VIP/${filename}`,
    data,
    directory: Directory.Documents,
    encoding,
    recursive: true,
  })
  const uri = await Filesystem.getUri({
    path: `SRC VIP/${filename}`,
    directory: Directory.Documents,
  })
  try {
    await Share.share({
      title: filename,
      url: uri.uri,
    })
  } catch {
    // user cancelled share
  }
}

export async function exportCsv(
  filename: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
) {
  const csv = Papa.unparse({
    fields: columns.map((c) => c.header),
    data: rows.map((row) => columns.map((c) => row[c.key] ?? '')),
  })
  if (Capacitor.isNativePlatform()) {
    await saveNative(filename, csv)
  } else {
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename)
  }
}

export async function exportXlsx(
  filename: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Data')
  ws.columns = columns.map((c) => ({ header: c.header, key: c.key, width: 22 }))
  ws.addRows(rows)
  const buf = await wb.xlsx.writeBuffer()
  if (Capacitor.isNativePlatform()) {
    const bytes = new Uint8Array(buf as ArrayBuffer)
    let binary = ''
    bytes.forEach((b) => {
      binary += String.fromCharCode(b)
    })
    await Filesystem.writeFile({
      path: `SRC VIP/${filename}`,
      data: btoa(binary),
      directory: Directory.Documents,
      recursive: true,
    })
  } else {
    saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename)
  }
}

export async function exportPdf(
  filename: string,
  title: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
) {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(14)
  doc.text(title, 14, 16)
  autoTable(doc, {
    startY: 22,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => String(row[c.key] ?? ''))),
  })
  if (Capacitor.isNativePlatform()) {
    const data = doc.output('datauristring').split(',')[1]
    await Filesystem.writeFile({
      path: `SRC VIP/${filename}`,
      data,
      directory: Directory.Documents,
      recursive: true,
    })
  } else {
    doc.save(filename)
  }
}
