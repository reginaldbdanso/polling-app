import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">Polling App</CardTitle>
              <CardDescription>Create and participate in polls with ease</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                Join our community to create engaging polls and gather valuable insights from your audience.
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild size="lg">
                  <Link href="/auth/sign-up">Get Started</Link>
                </Button>
                <Button variant="outline" asChild size="lg">
                  <Link href="/auth/login">Login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
