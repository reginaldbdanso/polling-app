"use client"

import type React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Loader2 } from "lucide-react"

const voteSchema = z.object({
  optionId: z.string().min(1, "Please select an option")
})

type VoteFormData = z.infer<typeof voteSchema>

interface PollOption {
  id: string
  option_text: string
  vote_count: number
}

interface VoteFormProps {
  pollId: string
  options: PollOption[]
  onVoteSuccess: () => void
}

export function VoteForm({ pollId, options, onVoteSuccess }: VoteFormProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)

  const form = useForm<VoteFormData>({
    resolver: zodResolver(voteSchema),
    defaultValues: {
      optionId: ""
    }
  })

  const onSubmit = async (data: VoteFormData) => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const { error } = await supabase.from("votes").insert({
        poll_id: pollId,
        option_id: data.optionId,
        user_id: user.id,
      })

      if (error) throw error

      setHasVoted(true)
      onVoteSuccess()
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred while voting")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Login Required</CardTitle>
          <CardDescription>You need to be logged in to vote on this poll</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push("/auth/login")} className="w-full">
            Login to Vote
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (hasVoted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Thank you for voting!</h3>
              <p className="text-muted-foreground">Your vote has been recorded successfully. You can now view the results below.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cast Your Vote</CardTitle>
        <CardDescription>Select your preferred option below</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="optionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Choose an option</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="space-y-3"
                    >
                      {options.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.id} id={option.id} />
                          <label
                            htmlFor={option.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            {option.option_text}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting Vote...
                </>
              ) : (
                "Submit Vote"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
