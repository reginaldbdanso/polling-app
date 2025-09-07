-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON public.profiles 
  FOR DELETE USING (auth.uid() = id);

-- Create polls table
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on polls
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for polls (public read, creator can manage)
CREATE POLICY "polls_select_all" ON public.polls 
  FOR SELECT USING (is_active = true);

CREATE POLICY "polls_insert_own" ON public.polls 
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "polls_update_own" ON public.polls 
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "polls_delete_own" ON public.polls 
  FOR DELETE USING (auth.uid() = creator_id);

-- Create poll options table
CREATE TABLE IF NOT EXISTS public.poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on poll options
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for poll options
CREATE POLICY "poll_options_select_all" ON public.poll_options 
  FOR SELECT USING (true);

CREATE POLICY "poll_options_insert_poll_creator" ON public.poll_options 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.creator_id = auth.uid()
    )
  );

-- Create votes table
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id) -- One vote per user per poll
);

-- Enable RLS on votes
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for votes
CREATE POLICY "votes_select_all" ON public.votes 
  FOR SELECT USING (true);

CREATE POLICY "votes_insert_own" ON public.votes 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "votes_update_own" ON public.votes 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "votes_delete_own" ON public.votes 
  FOR DELETE USING (auth.uid() = user_id);
