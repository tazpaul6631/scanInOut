import { existsSync, copyFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))

function copySqlWasm() {
  const src = resolve(root, 'node_modules/sql.js/dist/sql-wasm.wasm')
  const dest = resolve(root, 'public/sql-wasm.wasm')
  if (existsSync(src)) {
    mkdirSync(resolve(root, 'public'), { recursive: true })
    copyFileSync(src, dest)
  }
}

copySqlWasm()

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    include: ['sql.js/dist/sql-wasm.js'],
    exclude: ['@capacitor-mlkit/barcode-scanning'],
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },
})
