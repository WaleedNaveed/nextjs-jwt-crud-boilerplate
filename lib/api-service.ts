import { toast } from "@/components/ui/use-toast"
import type { ApiResponse, LoginResponse } from "./types"

const API_BASE_URL = "https://localhost:7285/api/v1"

class ApiService {
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private refreshPromise: Promise<boolean> | null = null

  constructor() {
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("accessToken")
      this.refreshToken = localStorage.getItem("refreshToken")
    }
  }

  setTokens(accessToken: string, refreshToken: string, role?: string) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken

    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken)
      localStorage.setItem("refreshToken", refreshToken)
      if (role) {
        localStorage.setItem("userRole", role)
      }
    }
  }

  clearTokens() {
    this.accessToken = null
    this.refreshToken = null

    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      localStorage.removeItem("userRole")
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      this.clearTokens()
      return false
    }

    try {
      const response = await fetch(`${API_BASE_URL}/User/RefreshToken`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      })

      if (response.status === 401) {
        this.clearTokens()
        return false
      }

      const data: ApiResponse<LoginResponse> = await response.json()

      if (!data.hasError && data.result) {
        this.setTokens(data.result.accessToken, data.result.refreshToken, data.result.role)
        return true
      } else {
        this.clearTokens()
        return false
      }
    } catch (error) {
      this.clearTokens()
      return false
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`
    } else {
    }

    return headers
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data: ApiResponse<T> = await response.json()

    if (data.hasError && data.errorMessage) {
      toast({
        title: "Error",
        description: data.errorMessage,
        variant: "destructive",
      })
    }

    return data
  }

  async request<T>(endpoint: string, method = "GET", body?: any, retry = true): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`
    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
    }

    if (body && method !== "GET") {
      options.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, options)

      if (response.status === 401 && retry) {
        if (this.refreshPromise) {
          const refreshed = await this.refreshPromise
          if (refreshed) {
            return this.request<T>(endpoint, method, body, false)
          } else {
            if (typeof window !== "undefined") {
              window.location.href = "/login"
            }
            return { result: {} as T, hasError: true, errorCode: 401, errorMessage: "Authentication failed" }
          }
        }

        this.refreshPromise = this.refreshAccessToken()
        const refreshed = await this.refreshPromise
        this.refreshPromise = null

        if (refreshed) {
          return this.request<T>(endpoint, method, body, false)
        } else {
          if (typeof window !== "undefined") {
            window.location.href = "/login"
          }
          return { result: {} as T, hasError: true, errorCode: 401, errorMessage: "Authentication failed" }
        }
      }

      return this.handleResponse<T>(response)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Network error"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      // If the error is likely due to an authentication issue, treat it as a 401
      if (errorMessage.includes("Failed to fetch") && retry) {
        if (this.refreshPromise) {
          const refreshed = await this.refreshPromise
          if (refreshed) {
            return this.request<T>(endpoint, method, body, false)
          }
        }

        this.refreshPromise = this.refreshAccessToken()
        const refreshed = await this.refreshPromise
        this.refreshPromise = null

        if (refreshed) {
          return this.request<T>(endpoint, method, body, false)
        }
      }

      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
      return { result: {} as T, hasError: true, errorCode: 500, errorMessage }
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "GET")
  }

  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "POST", body)
  }

  async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "PUT", body)
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "DELETE")
  }
}

const apiService = new ApiService()
export default apiService