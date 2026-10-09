/** Loose request bag when the server schema is not fully typed yet. */
export type ApiRecord = Record<string, unknown>

/** Shared envelope — tighten fields when the backend contract is confirmed. */
export interface ApiResponse<T = unknown> {
  data: T
  message?: string
  success?: boolean
}
