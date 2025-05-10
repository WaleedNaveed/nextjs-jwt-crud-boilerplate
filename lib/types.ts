// API response types
export interface ApiResponse<T> {
  result: T
  hasError: boolean
  errorCode: number
  errorMessage: string | null
}

// User types
export interface User {
  id: string
  email: string
  role: string
  name?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface ForgotPasswordRequest {
  email: string
}

export interface SetPasswordRequest {
  token: string
  password: string
  confirmPassword: string
}

export interface CreateUserRequest {
  email: string
  name: string
  role: number
}

// Product types
export interface Product {
  id: string
  name: string
  price: number
  quantity: number
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
}

export interface ProductListResponse {
  items: Product[]
  totalCount: number
  pageSize: number
  currentPage: number
  totalPages: number
}

export interface ProductRequest {
  name: string
  price: number
  quantity: number
}

export interface Role {
  id: number
  name: string
}
