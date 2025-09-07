"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Trophy, Users, Calendar } from "lucide-react"

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
    <Card className="w-full shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-xl font-bold text-gray-900">{poll.title}</CardTitle>
            {poll.description && (
              <CardDescription className="text-gray-600 text-base">
                {poll.description}
              </CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            {hasExpired && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                <Calendar className="h-3 w-3 mr-1" />
                Expired
              </Badge>
            )}
            {!poll.is_active && (
              <Badge variant="destructive" className="bg-red-100 text-red-700">
                Inactive
              </Badge>
            )}
            {isActive && (
              <Badge variant="default" className="bg-green-100 text-green-700">
                <Users className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {sortedOptions.map((option, index) => {
            const percentage = totalVotes > 0 ? (option.vote_count / totalVotes) * 100 : 0
            const isUserVote = poll.user_vote === option.id
            const isWinner = index === 0 && totalVotes > 0

            return (
              <div 
                key={option.id} 
                className={`relative p-4 rounded-lg border transition-all duration-300 hover:shadow-md ${
                  isUserVote 
                    ? "bg-blue-50 border-blue-200 shadow-sm" 
                    : isWinner 
                    ? "bg-yellow-50 border-yellow-200 shadow-sm" 
                    : "bg-white border-gray-200"
                }`}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: "fadeInUp 0.5s ease-out forwards"
                }}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isWinner 
                        ? "bg-yellow-100 text-yellow-700" 
                        : isUserVote 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {index + 1}
                    </div>
                    <span className={`text-base font-medium ${
                      isUserVote ? "text-blue-900" : isWinner ? "text-yellow-900" : "text-gray-900"
                    }`}>
                      {option.option_text}
                    </span>
                    {isUserVote && (
                      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                        Your Vote
                      </Badge>
                    )}
                    {isWinner && totalVotes > 0 && (
                      <Badge variant="default" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300">
                        <Trophy className="h-3 w-3 mr-1" />
                        Winner
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {option.vote_count}
                    </div>
                    <div className="text-sm text-gray-500">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <Progress 
                    value={percentage} 
                    className={`h-3 rounded-full ${
                      isUserVote 
                        ? "bg-blue-200" 
                        : isWinner 
                        ? "bg-yellow-200" 
                        : "bg-gray-200"
                    }`}
                  />
                  <div 
                    className={`absolute top-0 left-0 h-3 rounded-full transition-all duration-1000 ease-out ${
                      isUserVote 
                        ? "bg-gradient-to-r from-blue-400 to-blue-500" 
                        : isWinner 
                        ? "bg-gradient-to-r from-yellow-400 to-yellow-500" 
                        : "bg-gradient-to-r from-gray-400 to-gray-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="h-4 w-4" />
                <span className="font-medium">{totalVotes} total votes</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Created {new Date(poll.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-8 w-8 p-0 hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {totalVotes === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium">No votes yet</p>
            <p className="text-sm">Be the first to vote on this poll!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
