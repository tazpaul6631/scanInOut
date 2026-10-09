export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS schema_meta (
    version INTEGER PRIMARY KEY
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    barcode TEXT,
    price REAL NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    weight REAL,
    unit TEXT NOT NULL DEFAULT 'pcs',
    note TEXT,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    sync_status TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    record_id TEXT,
    kind TEXT NOT NULL,
    path TEXT NOT NULL,
    mime TEXT NOT NULL,
    size INTEGER,
    duration_ms INTEGER,
    created_at INTEGER NOT NULL,
    sync_status TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS outbox (
    id TEXT PRIMARY KEY,
    entity TEXT NOT NULL,
    action TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    retries INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS scan_logs (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    value TEXT NOT NULL,
    format TEXT,
    direction TEXT NOT NULL DEFAULT 'in',
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS scale_readings (
    id TEXT PRIMARY KEY,
    weight REAL NOT NULL,
    unit TEXT NOT NULL,
    stable INTEGER NOT NULL,
    source TEXT NOT NULL,
    raw TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)`,
  `CREATE INDEX IF NOT EXISTS idx_products_sync ON products(sync_status)`,
  `CREATE INDEX IF NOT EXISTS idx_outbox_created ON outbox(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_media_created ON media(created_at)`,
]

export const SCHEMA_VERSION = 2
