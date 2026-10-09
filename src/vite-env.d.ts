/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_APP_NAME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'sql.js/dist/sql-wasm.js' {
  import type initSqlJs from 'sql.js'
  const init: typeof initSqlJs
  export default init
}
