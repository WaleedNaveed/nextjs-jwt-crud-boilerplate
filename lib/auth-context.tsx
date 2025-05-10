"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import apiService from "./api-service"
import type { LoginRequest, User, ForgotPasswordRequest, SetPasswordRequest, CreateUserRequest } from "./types"

interface AuthContextType {
  user: User | null
  role: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginRequest) => Promise<boolean>
  logout: () => Promise<void>
  forgotPassword: (data: ForgotPasswordRequest) => Promise<boolean>
  setPassword: (data: SetPasswordRequest) => Promise<boolean>
  createUser: (data: CreateUserRequest) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const userRole = localStorage.getItem("userRole")
    const accessToken = localStorage.getItem("accessToken")

    if (accessToken && userRole) {
      setRole(userRole)
      setIsLoading(false)
    } else {
      setIsLoading(false)
    }
  }, [])

  // Listen for changes to localStorage to update role
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "userRole") {
        const newRole = event.newValue
        setRole(newRole)
      } else if (event.key === "accessToken" && event.newValue === null) {
        // If accessToken is removed, user is logged out
        setRole(null)
        setUser(null)
        router.push("/login")
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange)
      return () => window.removeEventListener("storage", handleStorageChange)
    }
  }, [router])

  const login = async (data: LoginRequest): Promise<boolean> => {
    try {
      const response = await apiService.post("/User/Login", data)

      if (!response.hasError && response.result) {
        const { accessToken, refreshToken, role } = response.result
        apiService.setTokens(accessToken, refreshToken, role)
        localStorage.setItem("userRole", role)
        setRole(role)
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  const logout = async () => {
    try {
      const response = await apiService.post("/User/Logout", {})
      if (response.hasError) {
      }
    } catch (error) {
    } finally {
      apiService.clearTokens()
      setUser(null)
      setRole(null)
      router.push("/login")
    }
  }

  const forgotPassword = async (data: ForgotPasswordRequest): Promise<boolean> => {
    try {
      const response = await apiService.post("/User/forgot-password", data)
      return !response.hasError
    } catch (error) {
      return false
    }
  }

  const setPassword = async (data: SetPasswordRequest): Promise<boolean> => {
    try {
      const response = await apiService.post("/User/set-password", data)
      return !response.hasError
    } catch (error) {
      return false
    }
  }

  const createUser = async (data: CreateUserRequest): Promise<boolean> => {
    try {
      const response = await apiService.post("/User", data)
      return !response.hasError
    } catch (error) {
      return false
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        isAuthenticated: !!role,
        login,
        logout,
        forgotPassword,
        setPassword,
        createUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}