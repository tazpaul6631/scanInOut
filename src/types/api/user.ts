export interface UserValidateRequest {
  email: string
  password: string
  loginAt: string
}

export interface ViewMenuPermission {
  id: string
  name?: string | null
  isAllow: boolean
}

export interface ViewPlatformPermission {
  code?: string | null
  menus?: ViewMenuPermission[] | null
}

export interface ViewValidateUser {
  id: string
  code?: string | null
  email?: string | null
  name?: string | null
  roleId: string
  roleName?: string | null
  avatar?: string | null
  accessToken?: string | null
  refreshToken?: string | null
  permissions?: ViewPlatformPermission[] | null
}

export interface UserQueryResultRequest {
  page?: number
  pageSize?: number
  id?: string | null
  ids?: string[] | null
  keyword?: string | null
  roleId?: string | null
  roleIds?: string[] | null
  isActive?: boolean | null
}

export interface ViewUser {
  id: string
  code?: string | null
  email?: string | null
  name?: string | null
  roleId: string
  avatar?: string | null
  isActive: boolean
  createdAt?: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
}

export interface UserQueryResult {
  items?: ViewUser[] | null
  totalCount: number
  page: number
  pageSize: number
  totalPage?: number
  hasNextPage?: boolean
  hasPreviousPage?: boolean
}

export interface UserCreateRequest {
  code: string
  email: string
  name: string
  roleId: string
  password: string
  isActive: boolean
  createdBy: string
  updatedBy: string
}

export interface UpdateUserRequest {
  code: string
  email: string
  name: string
  roleId: string
  isActive: boolean
  updatedBy: string
}

export interface DeleteUserRequest {
  updatedBy: string
}
