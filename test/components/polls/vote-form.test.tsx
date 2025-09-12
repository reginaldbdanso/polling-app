import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VoteForm } from '@/components/polls/vote-form'

// Mock the Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn().mockReturnThis(),
  })),
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock auth provider
const mockUseAuth = vi.fn()
vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockOptions = [
  { id: 'option-1', option_text: 'Option 1', vote_count: 0 },
  { id: 'option-2', option_text: 'Option 2', vote_count: 0 },
  { id: 'option-3', option_text: 'Option 3', vote_count: 0 },
]

const defaultProps = {
  pollId: 'poll-123',
  options: mockOptions,
  onVoteSuccess: vi.fn(),
}

describe('VoteForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      loading: false,
    })
  })

  describe('Form Validation', () => {
    it('should show validation error when no option is selected', async () => {
      const user = userEvent.setup()
      render(<VoteForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /submit vote/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Please select an option')).toBeInTheDocument()
      })
    })

    it('should not show validation error when option is selected', async () => {
      const user = userEvent.setup()
      render(<VoteForm {...defaultProps} />)

      const option1 = screen.getByLabelText('Option 1')
      await user.click(option1)

      const submitButton = screen.getByRole('button', { name: /submit vote/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText('Please select an option')).not.toBeInTheDocument()
      })
    })
  })

  describe('Vote Submission', () => {
    it('should successfully submit a vote', async () => {
      const user = userEvent.setup()
      const mockOnVoteSuccess = vi.fn()
      
      // Mock successful vote submission
      const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      })

      render(<VoteForm {...defaultProps} onVoteSuccess={mockOnVoteSuccess} />)

      // Select an option and submit
      const option1 = screen.getByLabelText('Option 1')
      await user.click(option1)

      const submitButton = screen.getByRole('button', { name: /submit vote/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith({
          poll_id: 'poll-123',
          option_id: 'option-1',
          user_id: 'test-user-id',
        })
        expect(mockOnVoteSuccess).toHaveBeenCalled()
      })
    })

    it('should handle vote submission error', async () => {
      const user = userEvent.setup()
      
      // Mock vote submission error
      const mockInsert = vi.fn().mockResolvedValue({ 
        data: null, 
        error: new Error('Vote submission failed') 
      })
      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      })

      render(<VoteForm {...defaultProps} />)

      // Select an option and submit
      const option1 = screen.getByLabelText('Option 1')
      await user.click(option1)

      const submitButton = screen.getByRole('button', { name: /submit vote/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Vote submission failed')).toBeInTheDocument()
      })
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      
      // Mock delayed vote submission
      const mockInsert = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: null, error: null }), 100))
      )
      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      })

      render(<VoteForm {...defaultProps} />)

      // Select an option and submit
      const option1 = screen.getByLabelText('Option 1')
      await user.click(option1)

      const submitButton = screen.getByRole('button', { name: /submit vote/i })
      await user.click(submitButton)

      // Check loading state
      expect(screen.getByText('Submitting Vote...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Authentication States', () => {
    it('should redirect to login when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      })

      const user = userEvent.setup()
      render(<VoteForm {...defaultProps} />)

      // Should show login required message
      expect(screen.getByText('Login Required')).toBeInTheDocument()
      expect(screen.getByText('You need to be logged in to vote on this poll')).toBeInTheDocument()

      // Click login button
      const loginButton = screen.getByRole('button', { name: /login to vote/i })
      await user.click(loginButton)

      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })

    it('should show loading state when authentication is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
      })

      render(<VoteForm {...defaultProps} />)

      // Should show loading spinner
      expect(screen.getByRole('button', { name: /submit vote/i })).toBeDisabled()
    })

    it('should show success message after successful vote', async () => {
      const user = userEvent.setup()
      
      // Mock successful vote submission
      const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      })

      render(<VoteForm {...defaultProps} />)

      // Select an option and submit
      const option1 = screen.getByLabelText('Option 1')
      await user.click(option1)

      const submitButton = screen.getByRole('button', { name: /submit vote/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Thank you for voting!')).toBeInTheDocument()
        expect(screen.getByText('Your vote has been recorded successfully. You can now view the results below.')).toBeInTheDocument()
      })
    })
  })

  describe('Option Rendering', () => {
    it('should render all provided options', () => {
      render(<VoteForm {...defaultProps} />)

      expect(screen.getByLabelText('Option 1')).toBeInTheDocument()
      expect(screen.getByLabelText('Option 2')).toBeInTheDocument()
      expect(screen.getByLabelText('Option 3')).toBeInTheDocument()
    })

    it('should allow selecting only one option at a time', async () => {
      const user = userEvent.setup()
      render(<VoteForm {...defaultProps} />)

      const option1 = screen.getByLabelText('Option 1')
      const option2 = screen.getByLabelText('Option 2')

      // Select first option
      await user.click(option1)
      expect(option1).toBeChecked()
      expect(option2).not.toBeChecked()

      // Select second option
      await user.click(option2)
      expect(option1).not.toBeChecked()
      expect(option2).toBeChecked()
    })
  })

  describe('Error Handling', () => {
    it('should handle generic error messages', async () => {
      const user = userEvent.setup()
      
      // Mock error without message
      const mockInsert = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: null } 
      })
      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      })

      render(<VoteForm {...defaultProps} />)

      // Select an option and submit
      const option1 = screen.getByLabelText('Option 1')
      await user.click(option1)

      const submitButton = screen.getByRole('button', { name: /submit vote/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('An error occurred while voting')).toBeInTheDocument()
      })
    })
  })
})
