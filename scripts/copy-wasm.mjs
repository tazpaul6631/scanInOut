import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(root, 'node_modules/sql.js/dist/sql-wasm.wasm')
const dest = resolve(root, 'public/sql-wasm.wasm')

if (!existsSync(src)) {
  console.warn('sql-wasm.wasm not found, skip copy')
  process.exit(0)
}

mkdirSync(resolve(root, 'public'), { recursive: true })
copyFileSync(src, dest)
console.log('Copied sql-wasm.wasm -> public/')
