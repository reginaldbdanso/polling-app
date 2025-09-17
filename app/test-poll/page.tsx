import { PollDetailWrapper } from "@/components/polls/poll-detail-wrapper"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

// Mock poll data for testing
const mockPoll = {
  id: "test-poll-123",
  title: "What's your favorite programming language?",
  description: "Help us understand the community's preferences for programming languages in 2024.",
  creator_id: "test-user-123",
  created_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  is_active: true,
  options: [
    { id: "opt-1", option_text: "JavaScript/TypeScript", vote_count: 45 },
    { id: "opt-2", option_text: "Python", vote_count: 38 },
    { id: "opt-3", option_text: "Rust", vote_count: 22 },
    { id: "opt-4", option_text: "Go", vote_count: 18 },
    { id: "opt-5", option_text: "Java", vote_count: 15 },
  ],
  user_vote: "opt-1"
}

export default function TestPollPage() {
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
            <h1 className="text-2xl font-bold">Test Poll</h1>
            <p className="text-muted-foreground">Demo of the enhanced voting functionality</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Demo Mode</h3>
          <p className="text-sm text-yellow-700">
            This is a test poll with mock data. In a real scenario, you would need to be logged in to vote.
            The voting form will redirect you to the login page if you're not authenticated.
          </p>
        </div>

        <PollDetailWrapper poll={mockPoll} />
      </div>
    </div>
  )
}
