"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { isAuthenticated, isLoading, role } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading) {
      const isAuthPage = ["/login", "/forgot-password", "/set-password"].some(
        (path) => pathname === path || pathname.startsWith("/set-password"),
      )

      if (!isAuthenticated && !isAuthPage) {
        router.push("/login")
      } else if (isAuthenticated && isAuthPage) {
        router.push("/products")
      } else if (isAuthenticated && allowedRoles && !allowedRoles.includes(role || "")) {
        router.push("/unauthorized")
      }
    }
  }, [isAuthenticated, isLoading, router, pathname, role, allowedRoles])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    )
  }

  return <>{children}</>
}
