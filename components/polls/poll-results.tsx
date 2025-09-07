"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface PollOption {
  id: string
  option_text: string
  vote_count: number
}

interface PollResultsProps {
  poll: {
    id: string
    title: string
    description: string | null
    created_at: string
    expires_at: string | null
    is_active: boolean
    options: PollOption[]
    user_vote?: string | null
  }
  onRefresh?: () => void
}

export function PollResults({ poll, onRefresh }: PollResultsProps) {
  const totalVotes = poll.options.reduce((sum, option) => sum + option.vote_count, 0)
  const hasExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false
  const isActive = poll.is_active && !hasExpired

  // Sort options by vote count (descending)
  const sortedOptions = [...poll.options].sort((a, b) => b.vote_count - a.vote_count)

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{poll.title}</CardTitle>
            {poll.description && <CardDescription>{poll.description}</CardDescription>}
          </div>
          <div className="flex gap-2">
            {hasExpired && <Badge variant="secondary">Expired</Badge>}
            {!poll.is_active && <Badge variant="destructive">Inactive</Badge>}
            {isActive && <Badge variant="default">Active</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {sortedOptions.map((option, index) => {
            const percentage = totalVotes > 0 ? (option.vote_count / totalVotes) * 100 : 0
            const isUserVote = poll.user_vote === option.id
            const isWinner = index === 0 && totalVotes > 0

            return (
              <div key={option.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${isUserVote ? "font-semibold" : ""}`}>
                      {option.option_text}
                    </span>
                    {isUserVote && (
                      <Badge variant="outline" className="text-xs">
                        Your Vote
                      </Badge>
                    )}
                    {isWinner && totalVotes > 0 && (
                      <Badge variant="default" className="text-xs">
                        Winner
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {option.vote_count} votes ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className={`h-2 ${isUserVote ? "bg-primary/20" : ""}`}
                />
              </div>
            )
          })}
        </div>

        <div className="flex justify-between items-center text-sm text-muted-foreground pt-2 border-t">
          <span>Total votes: {totalVotes}</span>
          <div className="flex items-center gap-2">
            <span>Created: {new Date(poll.created_at).toLocaleDateString()}</span>
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {totalVotes === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p>No votes yet. Be the first to vote!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
