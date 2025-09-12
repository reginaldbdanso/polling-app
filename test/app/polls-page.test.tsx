import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import PollsPage from '@/app/polls/page'

// Mock the server-side Supabase client
const mockServerSupabase = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockServerSupabase,
}))

// Mock the PollCard component
vi.mock('@/components/polls/poll-card', () => ({
  PollCard: ({ poll }: { poll: any }) => (
    <div data-testid={`poll-card-${poll.id}`}>
      <h3>{poll.title}</h3>
      <p>{poll.description}</p>
    </div>
  ),
}))

describe('PollsPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render polls successfully', async () => {
    const mockPolls = [
      {
        id: 'poll-1',
        title: 'Test Poll 1',
        description: 'Description 1',
        creator_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        expires_at: null,
        is_active: true,
        options: [
          { id: 'option-1', option_text: 'Option 1', vote_count: 5 },
          { id: 'option-2', option_text: 'Option 2', vote_count: 3 },
        ],
        profiles: { display_name: 'User One' },
        user_vote: null,
      },
      {
        id: 'poll-2',
        title: 'Test Poll 2',
        description: 'Description 2',
        creator_id: 'user-2',
        created_at: '2024-01-02T00:00:00Z',
        expires_at: null,
        is_active: true,
        options: [
          { id: 'option-3', option_text: 'Option A', vote_count: 2 },
          { id: 'option-4', option_text: 'Option B', vote_count: 8 },
        ],
        profiles: { display_name: 'User Two' },
        user_vote: 'option-3',
      },
    ]

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    // Mock successful data fetching
    mockServerSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockServerSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: mockPolls,
        error: null,
      }),
    })

    // Mock votes fetching for each poll
    mockServerSupabase.from
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockPolls,
          error: null,
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { option_id: 'option-3' },
          error: null,
        }),
      })

    const PageComponent = await PollsPage()
    render(PageComponent)

    // Should render both polls
    expect(screen.getByTestId('poll-card-poll-1')).toBeInTheDocument()
    expect(screen.getByTestId('poll-card-poll-2')).toBeInTheDocument()

    // Should show poll titles
    expect(screen.getByText('Test Poll 1')).toBeInTheDocument()
    expect(screen.getByText('Test Poll 2')).toBeInTheDocument()
  })

  it('should handle no polls found', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    // Mock successful authentication but no polls
    mockServerSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockServerSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    })

    const PageComponent = await PollsPage()
    render(PageComponent)

    // Should show no polls message
    expect(screen.getByText('No polls found')).toBeInTheDocument()
  })

  it('should handle database errors gracefully', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    // Mock authentication success but database error
    mockServerSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockServerSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Database connection failed'),
      }),
    })

    const PageComponent = await PollsPage()
    render(PageComponent)

    // Should show error message
    expect(screen.getByText('Error loading polls')).toBeInTheDocument()
  })

  it('should handle unauthenticated users', async () => {
    // Mock no user authentication
    mockServerSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const mockPolls = [
      {
        id: 'poll-1',
        title: 'Test Poll 1',
        description: 'Description 1',
        creator_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        expires_at: null,
        is_active: true,
        options: [
          { id: 'option-1', option_text: 'Option 1', vote_count: 5 },
          { id: 'option-2', option_text: 'Option 2', vote_count: 3 },
        ],
        profiles: { display_name: 'User One' },
        user_vote: null,
      },
    ]

    mockServerSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: mockPolls,
        error: null,
      }),
    })

    const PageComponent = await PollsPage()
    render(PageComponent)

    // Should still render polls but without user vote data
    expect(screen.getByTestId('poll-card-poll-1')).toBeInTheDocument()
    expect(screen.getByText('Test Poll 1')).toBeInTheDocument()
  })

  it('should handle polls with different states', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    const mockPolls = [
      {
        id: 'active-poll',
        title: 'Active Poll',
        description: 'This poll is active',
        creator_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-12-31T23:59:59Z',
        is_active: true,
        options: [],
        profiles: { display_name: 'User One' },
        user_vote: null,
      },
      {
        id: 'expired-poll',
        title: 'Expired Poll',
        description: 'This poll has expired',
        creator_id: 'user-2',
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2023-12-31T23:59:59Z',
        is_active: true,
        options: [],
        profiles: { display_name: 'User Two' },
        user_vote: null,
      },
      {
        id: 'inactive-poll',
        title: 'Inactive Poll',
        description: 'This poll is inactive',
        creator_id: 'user-3',
        created_at: '2024-01-01T00:00:00Z',
        expires_at: null,
        is_active: false,
        options: [],
        profiles: { display_name: 'User Three' },
        user_vote: null,
      },
    ]

    mockServerSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockServerSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: mockPolls,
        error: null,
      }),
    })

    const PageComponent = await PollsPage()
    render(PageComponent)

    // Should render all polls regardless of state
    expect(screen.getByTestId('poll-card-active-poll')).toBeInTheDocument()
    expect(screen.getByTestId('poll-card-expired-poll')).toBeInTheDocument()
    expect(screen.getByTestId('poll-card-inactive-poll')).toBeInTheDocument()
  })
})
