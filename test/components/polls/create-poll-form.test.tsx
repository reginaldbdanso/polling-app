import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreatePollForm } from '@/components/polls/create-poll-form'

// Mock the Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn(),
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
vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    loading: false,
  }),
}))

describe('CreatePollForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })
  })

  describe('Form Validation', () => {
    it('should show validation error for empty title', async () => {
      const user = userEvent.setup()
      render(<CreatePollForm />)

      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument()
      })
    })

    it('should show validation error for title too long', async () => {
      const user = userEvent.setup()
      render(<CreatePollForm />)

      const titleInput = screen.getByPlaceholderText("What's your question?")
      const longTitle = 'a'.repeat(201) // Exceeds 200 character limit
      
      await user.type(titleInput, longTitle)
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Title must be less than 200 characters')).toBeInTheDocument()
      })
    })

    it('should show validation error for description too long', async () => {
      const user = userEvent.setup()
      render(<CreatePollForm />)

      const descriptionInput = screen.getByPlaceholderText('Provide more context for your poll...')
      const longDescription = 'a'.repeat(1001) // Exceeds 1000 character limit
      
      await user.type(descriptionInput, longDescription)
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Description must be less than 1000 characters')).toBeInTheDocument()
      })
    })

    it('should show validation error for empty option text', async () => {
      const user = userEvent.setup()
      render(<CreatePollForm />)

      const titleInput = screen.getByPlaceholderText("What's your question?")
      await user.type(titleInput, 'Test Poll')

      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Option text is required')).toBeInTheDocument()
      })
    })

    it('should show validation error for option text too long', async () => {
      const user = userEvent.setup()
      render(<CreatePollForm />)

      const titleInput = screen.getByPlaceholderText("What's your question?")
      await user.type(titleInput, 'Test Poll')

      const optionInputs = screen.getAllByRole('textbox')
      const longOption = 'a'.repeat(101) // Exceeds 100 character limit
      
      await user.type(optionInputs[1], longOption) // Second input is first option
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Option must be less than 100 characters')).toBeInTheDocument()
      })
    })
  })

  describe('Form Functionality', () => {
    it('should add new option when add option button is clicked', async () => {
      const user = userEvent.setup()
      render(<CreatePollForm />)

      const addButton = screen.getByRole('button', { name: /add option/i })
      await user.click(addButton)

      const optionInputs = screen.getAllByRole('textbox')
      expect(optionInputs).toHaveLength(4) // 2 initial + 1 title + 1 description + 1 new option
    })

    it('should remove option when remove button is clicked', async () => {
      const user = userEvent.setup()
      render(<CreatePollForm />)

      // First add an option to have 3 total
      const addButton = screen.getByRole('button', { name: /add option/i })
      await user.click(addButton)

      // Now remove the first option
      const removeButtons = screen.getAllByRole('button', { name: '' }) // X buttons
      await user.click(removeButtons[0])

      const optionInputs = screen.getAllByRole('textbox')
      expect(optionInputs).toHaveLength(3) // Back to 2 options + title + description
    })

    it('should not allow removing options when only 2 remain', async () => {
      const user = userEvent.setup()
      render(<CreatePollForm />)

      const removeButtons = screen.queryAllByRole('button', { name: '' })
      expect(removeButtons).toHaveLength(0) // No remove buttons when only 2 options
    })

    it('should not allow adding more than 10 options', async () => {
      const user = userEvent.setup()
      render(<CreatePollForm />)

      // Add 8 more options (we start with 2, max is 10)
      for (let i = 0; i < 8; i++) {
        const addButton = screen.getByRole('button', { name: /add option/i })
        await user.click(addButton)
      }

      // Try to add one more
      const addButton = screen.queryByRole('button', { name: /add option/i })
      expect(addButton).not.toBeInTheDocument() // Button should be gone
    })
  })

  describe('Form Submission', () => {
    it('should successfully create a poll with valid data and redirect to poll page', async () => {
      const user = userEvent.setup()
      
      // Mock successful poll creation with realistic data
      const mockPollData = { 
        id: 'poll-123', 
        title: 'Test Poll',
        description: '',
        creator_id: 'test-user-id',
        created_at: '2024-01-01T00:00:00Z',
        expires_at: null,
        is_active: true
      }
      
      // Create separate mock functions for each database operation
      const mockPollInsert = vi.fn().mockResolvedValue({ data: mockPollData, error: null })
      const mockOptionsInsert = vi.fn().mockResolvedValue({ data: null, error: null })

      // Setup mock chain for poll creation then options creation
      mockSupabase.from
        .mockReturnValueOnce({
          insert: mockPollInsert,
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockPollData, error: null }),
        })
        .mockReturnValueOnce({
          insert: mockOptionsInsert,
        })

      render(<CreatePollForm />)

      // Fill out the form step by step with clear user interactions
      const titleInput = screen.getByPlaceholderText("What's your question?")
      await user.type(titleInput, 'Test Poll')

      // Get all text inputs and fill the option fields (indices 2 and 3 are the options)
      const allInputs = screen.getAllByRole('textbox')
      expect(allInputs).toHaveLength(4) // title, description, option1, option2
      
      await user.type(allInputs[2], 'Option 1')
      await user.type(allInputs[3], 'Option 2')

      // Verify form is ready for submission
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      expect(submitButton).toBeEnabled()

      // Submit the form
      await user.click(submitButton)

      // Verify loading state appears
      expect(screen.getByText('Creating Poll...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()

      // Wait for all async operations to complete
      await waitFor(() => {
        // Verify poll creation was called with correct data
        expect(mockPollInsert).toHaveBeenCalledTimes(1)
        expect(mockPollInsert).toHaveBeenCalledWith({
          title: 'Test Poll',
          description: '',
          creator_id: 'test-user-id',
          expires_at: null,
        })
      }, { timeout: 3000 })

      await waitFor(() => {
        // Verify options creation was called with correct data
        expect(mockOptionsInsert).toHaveBeenCalledTimes(1)
        expect(mockOptionsInsert).toHaveBeenCalledWith([
          { poll_id: 'poll-123', option_text: 'Option 1' },
          { poll_id: 'poll-123', option_text: 'Option 2' },
        ])
      }, { timeout: 3000 })

      await waitFor(() => {
        // Verify navigation to the new poll page
        expect(mockPush).toHaveBeenCalledTimes(1)
        expect(mockPush).toHaveBeenCalledWith('/polls/poll-123')
      }, { timeout: 3000 })
    })

    it('should handle poll creation error', async () => {
      const user = userEvent.setup()
      
      // Mock poll creation error
      const mockPollInsert = vi.fn().mockResolvedValue({ 
        data: null, 
        error: new Error('Database error') 
      })

      mockSupabase.from.mockReturnValue({
        insert: mockPollInsert,
        select: vi.fn().mockReturnThis(),
        single: vi.fn(),
      })

      render(<CreatePollForm />)

      // Fill out the form
      const titleInput = screen.getByPlaceholderText("What's your question?")
      await user.type(titleInput, 'Test Poll')

      // Get all text inputs and fill the option fields
      const allInputs = screen.getAllByRole('textbox')
      await user.type(allInputs[2], 'Option 1')
      await user.type(allInputs[3], 'Option 2')

      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Database error')).toBeInTheDocument()
      })
    })

    it('should handle options creation error', async () => {
      const user = userEvent.setup()
      
      // Mock successful poll creation but failed options creation
      const mockPollData = { id: 'poll-123', title: 'Test Poll' }
      const mockPollInsert = vi.fn().mockResolvedValue({ data: mockPollData, error: null })
      const mockOptionsInsert = vi.fn().mockResolvedValue({ 
        data: null, 
        error: new Error('Options error') 
      })

      mockSupabase.from
        .mockReturnValueOnce({
          insert: mockPollInsert,
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockPollData, error: null }),
        })
        .mockReturnValueOnce({
          insert: mockOptionsInsert,
        })

      render(<CreatePollForm />)

      // Fill out the form
      const titleInput = screen.getByPlaceholderText("What's your question?")
      await user.type(titleInput, 'Test Poll')

      // Get all text inputs and fill the option fields
      const allInputs = screen.getAllByRole('textbox')
      await user.type(allInputs[2], 'Option 1')
      await user.type(allInputs[3], 'Option 2')

      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Options error')).toBeInTheDocument()
      })
    })
  })

  describe('Authentication States', () => {
    it('should show login message when user is not authenticated', () => {
      // Mock the auth provider to return no user
      vi.mocked(require('@/components/auth/auth-provider').useAuth).mockReturnValue({
        user: null,
        loading: false,
      })

      render(<CreatePollForm />)

      expect(screen.getByText('Please login to create a poll.')).toBeInTheDocument()
    })

    it('should show loading state when authentication is loading', () => {
      // Mock the auth provider to return loading state
      vi.mocked(require('@/components/auth/auth-provider').useAuth).mockReturnValue({
        user: null,
        loading: true,
      })

      render(<CreatePollForm />)

      // Should show loading spinner instead of form
      expect(screen.getByRole('button', { name: /create poll/i })).toBeDisabled()
    })
  })
})
