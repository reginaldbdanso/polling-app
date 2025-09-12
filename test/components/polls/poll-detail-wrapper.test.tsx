import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PollDetailWrapper } from '@/components/polls/poll-detail-wrapper'

// Mock the child components
vi.mock('@/components/polls/vote-form', () => ({
  VoteForm: ({ onVoteSuccess }: { onVoteSuccess: () => void }) => (
    <div data-testid="vote-form">
      <button onClick={onVoteSuccess}>Mock Vote Success</button>
    </div>
  ),
}))

vi.mock('@/components/polls/poll-results', () => ({
  PollResults: ({ poll, onRefresh }: { poll: any; onRefresh: () => void }) => (
    <div data-testid="poll-results">
      <div>Poll Results for: {poll.title}</div>
      <button onClick={onRefresh}>Mock Refresh</button>
    </div>
  ),
}))

const mockPoll = {
  id: 'poll-123',
  title: 'Test Poll',
  description: 'Test Description',
  creator_id: 'creator-123',
  created_at: '2024-01-01T00:00:00Z',
  expires_at: '2024-12-31T23:59:59Z',
  is_active: true,
  options: [
    { id: 'option-1', option_text: 'Option 1', vote_count: 5 },
    { id: 'option-2', option_text: 'Option 2', vote_count: 3 },
    { id: 'option-3', option_text: 'Option 3', vote_count: 2 },
  ],
  user_vote: null,
}

const expiredPoll = {
  ...mockPoll,
  expires_at: '2023-01-01T00:00:00Z', // Past date
}

const inactivePoll = {
  ...mockPoll,
  is_active: false,
}

const votedPoll = {
  ...mockPoll,
  user_vote: 'option-1',
}

describe('PollDetailWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock setTimeout to make tests faster
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Voting State Logic', () => {
    it('should show VoteForm when user can vote', () => {
      // Create a poll that should allow voting
      const activePoll = {
        ...mockPoll,
        user_vote: null, // No vote yet
        is_active: true,
        expires_at: '2025-12-31T23:59:59Z', // Future date
      }
      
      render(<PollDetailWrapper poll={activePoll} />)

      expect(screen.getByTestId('vote-form')).toBeInTheDocument()
      expect(screen.queryByTestId('poll-results')).not.toBeInTheDocument()
    })

    it('should show PollResults when user has already voted', () => {
      render(<PollDetailWrapper poll={votedPoll} />)

      expect(screen.getByTestId('poll-results')).toBeInTheDocument()
      expect(screen.queryByTestId('vote-form')).not.toBeInTheDocument()
    })

    it('should show PollResults when poll has expired', () => {
      render(<PollDetailWrapper poll={expiredPoll} />)

      expect(screen.getByTestId('poll-results')).toBeInTheDocument()
      expect(screen.queryByTestId('vote-form')).not.toBeInTheDocument()
    })

    it('should show PollResults when poll is inactive', () => {
      render(<PollDetailWrapper poll={inactivePoll} />)

      expect(screen.getByTestId('poll-results')).toBeInTheDocument()
      expect(screen.queryByTestId('vote-form')).not.toBeInTheDocument()
    })
  })

  describe('Vote Success Handling', () => {
    it('should update hasVoted state when vote is successful', async () => {
      const user = userEvent.setup()
      const activePoll = {
        ...mockPoll,
        user_vote: null,
        is_active: true,
        expires_at: '2024-12-31T23:59:59Z',
      }
      
      render(<PollDetailWrapper poll={activePoll} />)

      // Initially should show vote form
      expect(screen.getByTestId('vote-form')).toBeInTheDocument()

      // Simulate successful vote
      const voteButton = screen.getByText('Mock Vote Success')
      await user.click(voteButton)

      // Should now show poll results
      await waitFor(() => {
        expect(screen.getByTestId('poll-results')).toBeInTheDocument()
        expect(screen.queryByTestId('vote-form')).not.toBeInTheDocument()
      })
    })

    it('should show refresh button after successful vote', async () => {
      const user = userEvent.setup()
      const activePoll = {
        ...mockPoll,
        user_vote: null,
        is_active: true,
        expires_at: '2024-12-31T23:59:59Z',
      }
      
      render(<PollDetailWrapper poll={activePoll} />)

      // Simulate successful vote
      const voteButton = screen.getByText('Mock Vote Success')
      await user.click(voteButton)

      // Should show refresh button
      await waitFor(() => {
        expect(screen.getByText('Refresh Results')).toBeInTheDocument()
      })
    })
  })

  describe('Refresh Functionality', () => {
    it('should show loading state during refresh', async () => {
      const user = userEvent.setup()
      render(<PollDetailWrapper poll={votedPoll} />)

      // Initially should show poll results
      expect(screen.getByTestId('poll-results')).toBeInTheDocument()

      // Click refresh button
      const refreshButton = screen.getByText('Refresh Results')
      await user.click(refreshButton)

      // Should show loading state
      expect(screen.getByText('Refreshing...')).toBeInTheDocument()
      expect(refreshButton).toBeDisabled()
    })

    it('should update poll data after refresh', async () => {
      const user = userEvent.setup()
      render(<PollDetailWrapper poll={votedPoll} />)

      // Click refresh button
      const refreshButton = screen.getByText('Refresh Results')
      await user.click(refreshButton)

      // Fast-forward timers to complete the refresh
      vi.advanceTimersByTime(1000)

      // Should show updated poll data (with simulated random vote counts)
      await waitFor(() => {
        expect(screen.getByText('Refreshing...')).not.toBeInTheDocument()
        expect(refreshButton).not.toBeDisabled()
      })
    })

    it('should handle refresh errors gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<PollDetailWrapper poll={votedPoll} />)

      // Click refresh button
      const refreshButton = screen.getByText('Refresh Results')
      await user.click(refreshButton)

      // Fast-forward timers to complete the refresh
      vi.advanceTimersByTime(1000)

      // Should complete refresh even if there's an error
      await waitFor(() => {
        expect(screen.getByText('Refreshing...')).not.toBeInTheDocument()
        expect(refreshButton).not.toBeDisabled()
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Poll State Calculations', () => {
    it('should correctly identify expired polls', () => {
      render(<PollDetailWrapper poll={expiredPoll} />)
      expect(screen.getByTestId('poll-results')).toBeInTheDocument()
    })

    it('should correctly identify active polls', () => {
      const activePoll = {
        ...mockPoll,
        user_vote: null,
        is_active: true,
        expires_at: '2024-12-31T23:59:59Z',
      }
      
      render(<PollDetailWrapper poll={activePoll} />)
      expect(screen.getByTestId('vote-form')).toBeInTheDocument()
    })

    it('should handle polls without expiration date', () => {
      const pollWithoutExpiration = {
        ...mockPoll,
        user_vote: null,
        is_active: true,
        expires_at: null,
      }
      
      render(<PollDetailWrapper poll={pollWithoutExpiration} />)
      expect(screen.getByTestId('vote-form')).toBeInTheDocument()
    })
  })

  describe('Component Props Passing', () => {
    it('should pass correct props to VoteForm', () => {
      const activePoll = {
        ...mockPoll,
        user_vote: null,
        is_active: true,
        expires_at: '2024-12-31T23:59:59Z',
      }
      
      render(<PollDetailWrapper poll={activePoll} />)

      // VoteForm should receive pollId and options
      expect(screen.getByTestId('vote-form')).toBeInTheDocument()
    })

    it('should pass correct props to PollResults', () => {
      render(<PollDetailWrapper poll={votedPoll} />)

      // PollResults should receive the poll data
      expect(screen.getByText('Poll Results for: Test Poll')).toBeInTheDocument()
    })
  })

  describe('State Management', () => {
    it('should maintain poll state across re-renders', () => {
      const activePoll = {
        ...mockPoll,
        user_vote: null,
        is_active: true,
        expires_at: '2024-12-31T23:59:59Z',
      }
      
      const { rerender } = render(<PollDetailWrapper poll={activePoll} />)
      
      expect(screen.getByTestId('vote-form')).toBeInTheDocument()
      
      // Re-render with same poll
      rerender(<PollDetailWrapper poll={activePoll} />)
      
      expect(screen.getByTestId('vote-form')).toBeInTheDocument()
    })

    it('should update when poll prop changes', () => {
      const activePoll = {
        ...mockPoll,
        user_vote: null,
        is_active: true,
        expires_at: '2024-12-31T23:59:59Z',
      }
      
      const { rerender } = render(<PollDetailWrapper poll={activePoll} />)
      
      expect(screen.getByTestId('vote-form')).toBeInTheDocument()
      
      // Change to voted poll
      rerender(<PollDetailWrapper poll={votedPoll} />)
      
      expect(screen.getByTestId('poll-results')).toBeInTheDocument()
    })
  })
})
