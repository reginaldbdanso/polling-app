"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Trophy, Users, Calendar } from "lucide-react"
import { useMemo } from "react"

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

// Helper function to calculate percentage
const calculatePercentage = (voteCount: number, totalVotes: number): number => {
  return totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0
}

// Helper function to get option styling classes
const getOptionClasses = (isUserVote: boolean, isWinner: boolean): string => {
  if (isUserVote) return "bg-blue-50 border-blue-200 shadow-sm"
  if (isWinner) return "bg-yellow-50 border-yellow-200 shadow-sm"
  return "bg-white border-gray-200"
}

// Helper function to get rank badge classes
const getRankBadgeClasses = (isWinner: boolean, isUserVote: boolean): string => {
  if (isWinner) return "bg-yellow-100 text-yellow-700"
  if (isUserVote) return "bg-blue-100 text-blue-700"
  return "bg-gray-100 text-gray-600"
}

// Helper function to get text classes
const getTextClasses = (isUserVote: boolean, isWinner: boolean): string => {
  if (isUserVote) return "text-blue-900"
  if (isWinner) return "text-yellow-900"
  return "text-gray-900"
}

// Helper function to get progress bar classes
const getProgressBarClasses = (isUserVote: boolean, isWinner: boolean): string => {
  if (isUserVote) return "bg-blue-200"
  if (isWinner) return "bg-yellow-200"
  return "bg-gray-200"
}

// Helper function to get progress fill classes
const getProgressFillClasses = (isUserVote: boolean, isWinner: boolean): string => {
  if (isUserVote) return "bg-gradient-to-r from-blue-400 to-blue-500"
  if (isWinner) return "bg-gradient-to-r from-yellow-400 to-yellow-500"
  return "bg-gradient-to-r from-gray-400 to-gray-500"
}

// Helper function to render status badges
const renderStatusBadges = (hasExpired: boolean, isActive: boolean, pollIsActive: boolean) => {
  return (
    <div className="flex gap-2">
      {hasExpired && (
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
          <Calendar className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      )}
      {!pollIsActive && (
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
  )
}

// Individual poll option component for better separation of concerns
interface PollOptionItemProps {
  option: PollOption
  index: number
  percentage: number
  isUserVote: boolean
  isWinner: boolean
  totalVotes: number
}

function PollOptionItem({ 
  option, 
  index, 
  percentage, 
  isUserVote, 
  isWinner, 
  totalVotes 
}: PollOptionItemProps) {
  return (
    <div 
      className={`relative p-4 rounded-lg border transition-all duration-300 hover:shadow-md ${getOptionClasses(isUserVote, isWinner)}`}
      style={{
        animationDelay: `${index * 100}ms`,
        animation: "fadeInUp 0.5s ease-out forwards"
      }}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadgeClasses(isWinner, isUserVote)}`}>
            {index + 1}
          </div>
          <span className={`text-base font-medium ${getTextClasses(isUserVote, isWinner)}`}>
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
          className={`h-3 rounded-full ${getProgressBarClasses(isUserVote, isWinner)}`}
        />
        <div 
          className={`absolute top-0 left-0 h-3 rounded-full transition-all duration-1000 ease-out ${getProgressFillClasses(isUserVote, isWinner)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export function PollResults({ poll, onRefresh }: PollResultsProps) {
  // Memoize expensive calculations
  const pollData = useMemo(() => {
    const totalVotes = poll.options.reduce((sum, option) => sum + option.vote_count, 0)
    const hasExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false
    const isActive = poll.is_active && !hasExpired
    const sortedOptions = [...poll.options].sort((a, b) => b.vote_count - a.vote_count)
    
    return {
      totalVotes,
      hasExpired,
      isActive,
      sortedOptions
    }
  }, [poll.options, poll.expires_at, poll.is_active])

  const { totalVotes, hasExpired, isActive, sortedOptions } = pollData

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
          {renderStatusBadges(hasExpired, isActive, poll.is_active)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {sortedOptions.map((option, index) => {
            const percentage = calculatePercentage(option.vote_count, totalVotes)
            const isUserVote = poll.user_vote === option.id
            const isWinner = index === 0 && totalVotes > 0

            return (
              <PollOptionItem
                key={option.id}
                option={option}
                index={index}
                percentage={percentage}
                isUserVote={isUserVote}
                isWinner={isWinner}
                totalVotes={totalVotes}
              />
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
