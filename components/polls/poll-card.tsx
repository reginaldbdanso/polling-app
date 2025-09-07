"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"
import { useState } from "react"
import { useRouter } from "next/navigation"

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

interface PollCardProps {
  poll: Poll
  showResults?: boolean
  onVote?: () => void
}

export function PollCard({ poll, showResults = false, onVote }: PollCardProps) {
  const { user, loading } = useAuth()
  const [selectedOption, setSelectedOption] = useState<string | null>(poll.user_vote || null)
  const [isVoting, setIsVoting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const totalVotes = poll.options.reduce((sum, option) => sum + option.vote_count, 0)
  const hasExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false
  const canVote = user && !selectedOption && !hasExpired && poll.is_active

  const handleVote = async (optionId: string) => {
    if (!user || isVoting) return

    setIsVoting(true)
    try {
      const { error } = await supabase.from("votes").insert({
        poll_id: poll.id,
        option_id: optionId,
        user_id: user.id,
      })

      if (error) throw error

      setSelectedOption(optionId)
      onVote?.()
    } catch (error) {
      console.error("Error voting:", error)
    } finally {
      setIsVoting(false)
    }
  }

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
            {poll.is_active && !hasExpired && <Badge variant="default">Active</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {poll.options.map((option) => {
            const percentage = totalVotes > 0 ? (option.vote_count / totalVotes) * 100 : 0
            const isSelected = selectedOption === option.id

            return (
              <div key={option.id} className="space-y-2">
                {canVote ? (
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => handleVote(option.id)}
                    disabled={isVoting}
                  >
                    {option.option_text}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${isSelected ? "font-medium" : ""}`}>{option.option_text}</span>
                      <span className="text-sm text-muted-foreground">
                        {option.vote_count} votes ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex justify-between items-center text-sm text-muted-foreground pt-2 border-t">
          <span>Total votes: {totalVotes}</span>
          <span>Created: {new Date(poll.created_at).toLocaleDateString()}</span>
        </div>

        {!loading && !user && (
          <div className="text-center">
            <Button variant="outline" onClick={() => router.push("/auth/login")}>
              Login to Vote
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
