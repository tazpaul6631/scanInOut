export interface ViewRole {
  id: string
  code?: string | null
  name?: string | null
  isActive: boolean
  isAdmin?: boolean
  priority?: number
}
