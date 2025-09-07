import { createClient } from "@/lib/supabase/server"
import { PollDetailWrapper } from "@/components/polls/poll-detail-wrapper"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"

export default async function PollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Get current user
  const { data: userData } = await supabase.auth.getUser()

  // Get poll with options
  const { data: poll, error } = await supabase
    .from("polls")
    .select(
      `
      *,
      options:poll_options(*)
    `,
    )
    .eq("id", id)
    .single()

  // Get creator profile separately
  let pollWithProfile = poll
  if (poll) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("id", poll.creator_id)
      .single()
    
    pollWithProfile = {
      ...poll,
      profiles: profile || { display_name: null }
    }
  }

  if (error || !pollWithProfile) {
    notFound()
  }

  // Get user's vote if logged in
  let userVote = null
  if (userData?.user) {
    const { data: voteData } = await supabase
      .from("votes")
      .select("option_id")
      .eq("poll_id", id)
      .eq("user_id", userData.user.id)
      .single()

    userVote = voteData?.option_id || null
  }

  const pollWithVote = {
    ...pollWithProfile,
    user_vote: userVote,
  }

  return (
    <div className="min-h-svh w-full p-6 md:p-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/polls">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Poll Details</h1>
            <p className="text-muted-foreground">View and participate in this poll</p>
          </div>
        </div>

        <PollDetailWrapper poll={pollWithVote} />
      </div>
    </div>
  )
}
