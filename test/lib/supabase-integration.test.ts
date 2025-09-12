import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/client'

// Mock the Supabase client with more realistic behavior
const mockSupabaseClient = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
}

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: () => mockSupabaseClient,
}))

describe('Supabase Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Poll Creation Integration', () => {
    it('should create a poll with options successfully', async () => {
      const mockPollData = {
        id: 'poll-123',
        title: 'Test Poll',
        description: 'Test Description',
        creator_id: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        expires_at: null,
        is_active: true,
      }

      const mockOptionsData = [
        { id: 'option-1', poll_id: 'poll-123', option_text: 'Option 1', vote_count: 0 },
        { id: 'option-2', poll_id: 'poll-123', option_text: 'Option 2', vote_count: 0 },
      ]

      // Mock poll creation
      const mockPollInsert = vi.fn().mockResolvedValue({
        data: mockPollData,
        error: null,
      })

      // Mock options creation
      const mockOptionsInsert = vi.fn().mockResolvedValue({
        data: mockOptionsData,
        error: null,
      })

      mockSupabaseClient.from
        .mockReturnValueOnce({
          insert: mockPollInsert,
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockPollData, error: null }),
        })
        .mockReturnValueOnce({
          insert: mockOptionsInsert,
        })

      const supabase = createClient()

      // Test poll creation
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({
          title: 'Test Poll',
          description: 'Test Description',
          creator_id: 'user-123',
        })
        .select()
        .single()

      expect(pollError).toBeNull()
      expect(poll).toEqual(mockPollData)
      expect(mockPollInsert).toHaveBeenCalledWith({
        title: 'Test Poll',
        description: 'Test Description',
        creator_id: 'user-123',
      })

      // Test options creation
      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert([
          { poll_id: 'poll-123', option_text: 'Option 1' },
          { poll_id: 'poll-123', option_text: 'Option 2' },
        ])

      expect(optionsError).toBeNull()
      expect(mockOptionsInsert).toHaveBeenCalledWith([
        { poll_id: 'poll-123', option_text: 'Option 1' },
        { poll_id: 'poll-123', option_text: 'Option 2' },
      ])
    })

    it('should handle poll creation errors', async () => {
      const mockError = new Error('Database connection failed')
      
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
        select: vi.fn().mockReturnThis(),
        single: vi.fn(),
      })

      const supabase = createClient()

      const { data, error } = await supabase
        .from('polls')
        .insert({
          title: 'Test Poll',
          creator_id: 'user-123',
        })
        .select()
        .single()

      expect(error).toEqual(mockError)
      expect(data).toBeNull()
    })
  })

  describe('Vote Submission Integration', () => {
    it('should submit a vote successfully', async () => {
      const mockVoteData = {
        id: 'vote-123',
        poll_id: 'poll-123',
        option_id: 'option-1',
        user_id: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
      }

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: mockVoteData,
          error: null,
        }),
      })

      const supabase = createClient()

      const { data, error } = await supabase
        .from('votes')
        .insert({
          poll_id: 'poll-123',
          option_id: 'option-1',
          user_id: 'user-123',
        })

      expect(error).toBeNull()
      expect(data).toEqual(mockVoteData)
    })

    it('should handle duplicate vote errors', async () => {
      const mockError = new Error('duplicate key value violates unique constraint')
      
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      })

      const supabase = createClient()

      const { data, error } = await supabase
        .from('votes')
        .insert({
          poll_id: 'poll-123',
          option_id: 'option-1',
          user_id: 'user-123',
        })

      expect(error).toEqual(mockError)
      expect(data).toBeNull()
    })
  })

  describe('Poll Retrieval Integration', () => {
    it('should fetch poll with options and user vote', async () => {
      const mockPollData = {
        id: 'poll-123',
        title: 'Test Poll',
        description: 'Test Description',
        creator_id: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        expires_at: null,
        is_active: true,
        options: [
          { id: 'option-1', option_text: 'Option 1', vote_count: 5 },
          { id: 'option-2', option_text: 'Option 2', vote_count: 3 },
        ],
      }

      const mockUserVote = {
        option_id: 'option-1',
      }

      // Mock poll fetch
      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockPollData,
            error: null,
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockUserVote,
            error: null,
          }),
        })

      const supabase = createClient()

      // Test poll fetch
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .select(`
          *,
          options:poll_options(*)
        `)
        .eq('id', 'poll-123')
        .single()

      expect(pollError).toBeNull()
      expect(poll).toEqual(mockPollData)

      // Test user vote fetch
      const { data: vote, error: voteError } = await supabase
        .from('votes')
        .select('option_id')
        .eq('poll_id', 'poll-123')
        .eq('user_id', 'user-123')
        .single()

      expect(voteError).toBeNull()
      expect(vote).toEqual(mockUserVote)
    })

    it('should handle poll not found errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows returned' },
        }),
      })

      const supabase = createClient()

      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .eq('id', 'non-existent-poll')
        .single()

      expect(error).toBeDefined()
      expect(data).toBeNull()
    })
  })

  describe('Authentication Integration', () => {
    it('should get current user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const supabase = createClient()

      const { data, error } = await supabase.auth.getUser()

      expect(error).toBeNull()
      expect(data.user).toEqual(mockUser)
    })

    it('should handle authentication errors', async () => {
      const mockError = new Error('Invalid JWT token')
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: mockError,
      })

      const supabase = createClient()

      const { data, error } = await supabase.auth.getUser()

      expect(error).toEqual(mockError)
      expect(data.user).toBeNull()
    })
  })

  describe('Complex Query Integration', () => {
    it('should fetch polls with creator profiles', async () => {
      const mockPollsData = [
        {
          id: 'poll-1',
          title: 'Poll 1',
          creator_id: 'user-1',
          profiles: { display_name: 'User One' },
        },
        {
          id: 'poll-2',
          title: 'Poll 2',
          creator_id: 'user-2',
          profiles: { display_name: 'User Two' },
        },
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockPollsData,
          error: null,
        }),
      })

      const supabase = createClient()

      const { data, error } = await supabase
        .from('polls')
        .select(`
          *,
          profiles!polls_creator_id_fkey(display_name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10)

      expect(error).toBeNull()
      expect(data).toEqual(mockPollsData)
    })
  })
})
