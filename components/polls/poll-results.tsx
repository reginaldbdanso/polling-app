"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Trophy, Users, Calendar, BarChart3, PieChart, TrendingUp } from "lucide-react"
import { useMemo, useState } from "react"
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

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

type ChartType = "bar" | "pie" | "area"

// Color palette for charts
const COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1", 
  "#d084d0", "#ffb347", "#87ceeb", "#dda0dd", "#98fb98"
]

// Chart configuration for shadcn/ui charts
const chartConfig = {
  votes: {
    label: "Votes",
    color: "hsl(var(--chart-1))",
  },
  percentage: {
    label: "Percentage",
    color: "hsl(var(--chart-2))",
  },
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

// Custom tooltip for pie chart
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900">{data.option_text}</p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">{data.vote_count}</span> votes ({data.percentage.toFixed(1)}%)
        </p>
        {data.isUserVote && (
          <p className="text-xs text-blue-600 font-medium">Your Vote</p>
        )}
        {data.isWinner && (
          <p className="text-xs text-yellow-600 font-medium">Winner</p>
        )}
      </div>
    )
  }
  return null
}

// Custom tooltip for bar chart
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900">{label}</p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">{data.vote_count}</span> votes ({data.percentage.toFixed(1)}%)
        </p>
        {data.isUserVote && (
          <p className="text-xs text-blue-600 font-medium">Your Vote</p>
        )}
        {data.isWinner && (
          <p className="text-xs text-yellow-600 font-medium">Winner</p>
        )}
      </div>
    )
  }
  return null
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

// Chart components
function PieChartComponent({ data, totalVotes }: { data: any[], totalVotes: number }) {
  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[500px]">
      <RechartsPieChart
        accessibilityLayer
        title="Poll Results Pie Chart"
        role="img"
        aria-label={`Pie chart showing poll results with ${totalVotes} total votes`}
      >
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ option_text, percentage }) => `${option_text}: ${percentage.toFixed(1)}%`}
          outerRadius={120}
          fill="#8884d8"
          dataKey="vote_count"
          animationBegin={0}
          animationDuration={1000}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.isUserVote ? "#3b82f6" : entry.isWinner ? "#f59e0b" : COLORS[index % COLORS.length]} 
            />
          ))}
        </Pie>
        <RechartsTooltip content={<CustomPieTooltip />} />
        <Legend />
      </RechartsPieChart>
    </ChartContainer>
  )
}

function BarChartComponent({ data }: { data: any[] }) {
  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-video max-h-[500px]">
      <RechartsBarChart
        data={data}
        accessibilityLayer
        title="Poll Results Bar Chart"
        role="img"
        aria-label={`Bar chart showing poll results with vote counts for each option`}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="option_text" 
          angle={-45}
          textAnchor="end"
          height={100}
          interval={0}
        />
        <YAxis />
        <RechartsTooltip content={<CustomBarTooltip />} />
        <Bar 
          dataKey="vote_count" 
          fill="#8884d8"
          radius={[4, 4, 0, 0]}
          animationBegin={0}
          animationDuration={1000}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.isUserVote ? "#3b82f6" : entry.isWinner ? "#f59e0b" : COLORS[index % COLORS.length]} 
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ChartContainer>
  )
}

function AreaChartComponent({ data }: { data: any[] }) {
  // For area chart, we'll simulate time-based data by creating cumulative data
  const areaData = data.map((item, index) => ({
    ...item,
    cumulative: data.slice(0, index + 1).reduce((sum, d) => sum + d.vote_count, 0)
  }))

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-video max-h-[500px]">
      <AreaChart
        data={areaData}
        accessibilityLayer
        title="Poll Results Area Chart"
        role="img"
        aria-label={`Area chart showing poll results with vote distribution`}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="option_text" />
        <YAxis />
        <RechartsTooltip content={<CustomBarTooltip />} />
        <Area
          type="monotone"
          dataKey="vote_count"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.6}
          animationBegin={0}
          animationDuration={1000}
        />
      </AreaChart>
    </ChartContainer>
  )
}

export function PollResults({ poll, onRefresh }: PollResultsProps) {
  const [activeChart, setActiveChart] = useState<ChartType>("bar")

  // Memoize expensive calculations
  const pollData = useMemo(() => {
    const totalVotes = poll.options.reduce((sum, option) => sum + option.vote_count, 0)
    const hasExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false
    const isActive = poll.is_active && !hasExpired
    const sortedOptions = [...poll.options].sort((a, b) => b.vote_count - a.vote_count)
    
    // Prepare data for charts
    const chartData = sortedOptions.map((option, index) => {
      const percentage = calculatePercentage(option.vote_count, totalVotes)
      const isUserVote = poll.user_vote === option.id
      const isWinner = index === 0 && totalVotes > 0
      
      return {
        ...option,
        percentage,
        isUserVote,
        isWinner,
        index
      }
    })
    
    return {
      totalVotes,
      hasExpired,
      isActive,
      sortedOptions,
      chartData
    }
  }, [poll.options, poll.expires_at, poll.is_active, poll.user_vote])

  const { totalVotes, hasExpired, isActive, sortedOptions, chartData } = pollData

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
      <CardContent className="space-y-6">
        {/* Chart Visualization Section */}
        {totalVotes > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Visualization</h3>
              <Tabs value={activeChart} onValueChange={(value) => setActiveChart(value as ChartType)}>
                <TabsList 
                  className="grid w-full grid-cols-3"
                  role="tablist"
                  aria-label="Chart type selection"
                >
                  <TabsTrigger 
                    value="bar" 
                    className="flex items-center gap-2"
                    role="tab"
                    aria-label="Bar chart view"
                    aria-describedby="chart-description"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Bar
                  </TabsTrigger>
                  <TabsTrigger 
                    value="pie" 
                    className="flex items-center gap-2"
                    role="tab"
                    aria-label="Pie chart view"
                    aria-describedby="chart-description"
                  >
                    <PieChart className="h-4 w-4" />
                    Pie
                  </TabsTrigger>
                  <TabsTrigger 
                    value="area" 
                    className="flex items-center gap-2"
                    role="tab"
                    aria-label="Area chart view"
                    aria-describedby="chart-description"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Area
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div id="chart-description" className="sr-only">
              Interactive chart showing poll results. Use arrow keys to navigate between data points. 
              Press Tab to switch between chart types.
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              {activeChart === "pie" && <PieChartComponent data={chartData} totalVotes={totalVotes} />}
              {activeChart === "bar" && <BarChartComponent data={chartData} />}
              {activeChart === "area" && <AreaChartComponent data={chartData} />}
            </div>
          </div>
        )}

        {/* Traditional List View */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Results</h3>
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