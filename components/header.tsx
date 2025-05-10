"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

export default function Header() {
  const { logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      })
    }
  }

  return (
    <header className="flex items-center justify-between p-4 border-b mb-6">
      <div className="flex-grow"></div> {/* To push logout to the far right */}
      <Button onClick={handleLogout} variant="outline" className="ml-auto">
        Logout
      </Button>
    </header>
  )
}
