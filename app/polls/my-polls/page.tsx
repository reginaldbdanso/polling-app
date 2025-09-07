import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PollCard } from "@/components/polls/poll-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function MyPollsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user's polls with their options
  const { data: polls, error: pollsError } = await supabase
    .from("polls")
    .select(
      `
      *,
      options:poll_options(*)
    `,
    )
    .eq("creator_id", data.user.id)
    .order("created_at", { ascending: false })

  if (pollsError) {
    console.error("Error fetching user polls:", pollsError)
    return <div>Error loading your polls</div>
  }

  return (
    <div className="min-h-svh w-full p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Polls</h1>
            <p className="text-muted-foreground">Manage your created polls</p>
          </div>
          <Button asChild>
            <Link href="/polls/create">Create New Poll</Link>
          </Button>
        </div>

        {polls && polls.length > 0 ? (
          <div className="grid gap-6">
            {polls.map((poll) => (
              <PollCard key={poll.id} poll={poll} showResults={true} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">You haven't created any polls yet.</p>
            <Button asChild>
              <Link href="/polls/create">Create Your First Poll</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
