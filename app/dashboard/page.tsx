import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/auth/logout-button"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get user profile - middleware already verified authentication
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user?.id).single()

  return (
    <div className="min-h-svh w-full p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {profile?.display_name || user?.email}!</p>
          </div>
          <LogoutButton />
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Create Poll</CardTitle>
              <CardDescription>Start a new poll and gather opinions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/polls/create">Create New Poll</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Polls</CardTitle>
              <CardDescription>View and manage your created polls</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full bg-transparent">
                <Link href="/polls/my-polls">View My Polls</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Browse Polls</CardTitle>
              <CardDescription>Participate in community polls</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full bg-transparent">
                <Link href="/polls">Browse All Polls</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest polling activity</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No recent activity yet. Create your first poll to get started!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
