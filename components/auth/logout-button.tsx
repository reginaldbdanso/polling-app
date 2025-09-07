"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "./auth-provider"
import { useRouter } from "next/navigation"

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function LogoutButton({ variant = "outline", size = "default" }: LogoutButtonProps) {
  const { signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <Button variant={variant} size={size} onClick={handleLogout}>
      Logout
    </Button>
  )
}
