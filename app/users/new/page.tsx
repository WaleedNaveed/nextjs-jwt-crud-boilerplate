"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import apiService from "@/lib/api-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import AuthGuard from "@/components/auth-guard"
import { ArrowLeftIcon, SaveIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Roles } from "@/lib/constants/roles"
import Header from "@/components/header"
import { Role } from "@/lib/types"

export default function AddUserPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<string>("")
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingRoles, setIsFetchingRoles] = useState(true)
  const { createUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchRoles = async () => {
      setIsFetchingRoles(true)
      try {
        const response = await apiService.get<Role[]>("/Role")
        if (!response.hasError && response.result) {
          setRoles(response.result)
          if (response.result.length > 0) {
            const defaultRoleId = response.result[0].id.toString()
            setRole(defaultRoleId)
          } else {
            toast({
              title: "Warning",
              description: "No roles available. Please contact support.",
              variant: "destructive",
            })
          }
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch roles: " + (response.errorMessage || "Unknown error"),
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch roles",
          variant: "destructive",
        })
      } finally {
        setIsFetchingRoles(false)
      }
    }

    fetchRoles()
  }, [])

  useEffect(() => {
    if (roles.length > 0) {
    } else {
    }
  }, [roles])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !email || !role) {
      toast({
        title: "Validation Error",
        description: "All fields are required",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const success = await createUser({
        name,
        email,
        role: Number(role),
      })

      if (success) {
        toast({
          title: "Success",
          description: "User created successfully. They will receive an email to set their password.",
        })
        router.push("/products")
      } else {
        toast({
          title: "Error",
          description: "Failed to create user",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthGuard allowedRoles={[Roles.SuperAdmin, Roles.Admin]}>
      <div className="container mx-auto py-8">
        <Header />
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Add New User</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push("/products")}>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </div>
        </div>

        <Card>
          {isFetchingRoles ? (
            <CardContent className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={(value) => setRole(value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-muted-foreground">
                          No roles available
                        </div>
                      ) : (
                        roles.map((r) => {
                          return (
                            <SelectItem key={r.id} value={r.id.toString()}>
                              {r.name}
                            </SelectItem>
                          )
                        })
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading || isFetchingRoles || roles.length === 0}>
                  {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                  ) : (
                    <>
                      <SaveIcon className="mr-2 h-4 w-4" />
                      Create User
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </AuthGuard>
  )
}