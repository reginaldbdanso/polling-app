import { createClient } from "@/lib/supabase/server"
import { PollCard } from "@/components/polls/poll-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function PollsPage() {
  const supabase = await createClient()

  // Get all active polls with their options
  const { data: polls, error } = await supabase
    .from("polls")
    .select(
      `
      *,
      options:poll_options(*)
    `,
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  // Get creator profiles separately to avoid relationship issues
  let pollsWithProfiles = polls
  if (polls && polls.length > 0) {
    const creatorIds = [...new Set(polls.map(poll => poll.creator_id))]
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", creatorIds)
    
    pollsWithProfiles = polls.map(poll => ({
      ...poll,
      profiles: profiles?.find(profile => profile.id === poll.creator_id) || { display_name: null }
    }))
  }

  if (error) {
    console.error("Error fetching polls:", error)
    return <div>Error loading polls</div>
  }

  return (
    <div className="min-h-svh w-full p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">All Polls</h1>
            <p className="text-muted-foreground">Browse and participate in community polls</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/test-poll">Test Poll</Link>
            </Button>
            <Button asChild>
              <Link href="/polls/create">Create Poll</Link>
            </Button>
          </div>
        </div>

        {pollsWithProfiles && pollsWithProfiles.length > 0 ? (
          <div className="grid gap-6">
            {pollsWithProfiles.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No polls available yet.</p>
            <Button asChild>
              <Link href="/polls/create">Create the First Poll</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
