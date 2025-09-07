import { CreatePollForm } from "@/components/polls/create-poll-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function CreatePollPage() {
  return (
    <div className="min-h-svh w-full p-6 md:p-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Poll</h1>
            <p className="text-muted-foreground">Share your question with the community</p>
          </div>
        </div>

        <CreatePollForm />
      </div>
    </div>
  )
}
