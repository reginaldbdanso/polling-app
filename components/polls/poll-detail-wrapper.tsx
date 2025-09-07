"use client"

import { useState } from "react"
import { VoteForm } from "./vote-form"
import { PollResults } from "./poll-results"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface PollOption {
  id: string
  option_text: string
  vote_count: number
}

interface Poll {
  id: string
  title: string
  description: string | null
  creator_id: string
  created_at: string
  expires_at: string | null
  is_active: boolean
  options: PollOption[]
  user_vote?: string | null
}

interface PollDetailWrapperProps {
  poll: Poll
}

export function PollDetailWrapper({ poll }: PollDetailWrapperProps) {
  const [currentPoll, setCurrentPoll] = useState(poll)
  const [hasVoted, setHasVoted] = useState(!!poll.user_vote)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleVoteSuccess = () => {
    setHasVoted(true)
    // Refresh poll data to show updated vote counts
    refreshPollData()
  }

  const refreshPollData = async () => {
    setIsRefreshing(true)
    try {
      // Simulate API call to refresh poll data
      // In a real app, you'd make an actual API call here
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update vote counts to simulate new votes
      const updatedOptions = currentPoll.options.map(option => ({
        ...option,
        vote_count: option.vote_count + Math.floor(Math.random() * 3)
      }))
      
      setCurrentPoll(prev => ({
        ...prev,
        options: updatedOptions
      }))
    } catch (error) {
      console.error("Error refreshing poll data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const hasExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false
  const canVote = !hasVoted && !hasExpired && poll.is_active

  return (
    <div className="space-y-6">
      {canVote ? (
        <VoteForm
          pollId={poll.id}
          options={poll.options}
          onVoteSuccess={handleVoteSuccess}
        />
      ) : (
        <PollResults
          poll={currentPoll}
          onRefresh={refreshPollData}
        />
      )}

      {hasVoted && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={refreshPollData}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh Results"}
          </Button>
        </div>
      )}
    </div>
  )
}
