-- Create enum for moderation status
CREATE TYPE public.moderation_status AS ENUM ('pending', 'approved', 'rejected');

-- Create people table for face comparison
CREATE TABLE public.people (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 1200,
  total_votes INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  moderation_status moderation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create votes table for tracking voting history and anti-spam
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  person1_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  person2_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  winner_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  rating_change INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure person1_id != person2_id
  CONSTRAINT different_people CHECK (person1_id != person2_id),
  -- Ensure winner is one of the two people
  CONSTRAINT valid_winner CHECK (winner_id = person1_id OR winner_id = person2_id),
  -- Prevent duplicate votes for same matchup by same session
  UNIQUE(session_id, person1_id, person2_id)
);

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);

-- Enable Row Level Security
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Create policies for people table
CREATE POLICY "Anyone can view approved people" 
ON public.people 
FOR SELECT 
USING (is_approved = true);

CREATE POLICY "Anyone can insert new people" 
ON public.people 
FOR INSERT 
WITH CHECK (true);

-- Create policies for votes table
CREATE POLICY "Anyone can view votes" 
ON public.votes 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert votes" 
ON public.votes 
FOR INSERT 
WITH CHECK (true);

-- Create storage policies for profile photos
CREATE POLICY "Profile photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-photos');

CREATE POLICY "Anyone can upload profile photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profile-photos');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for people table
CREATE TRIGGER update_people_updated_at
BEFORE UPDATE ON public.people
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_people_rating ON public.people(rating DESC) WHERE is_approved = true;
CREATE INDEX idx_people_approved ON public.people(is_approved);
CREATE INDEX idx_votes_session_people ON public.votes(session_id, person1_id, person2_id);
CREATE INDEX idx_votes_created_at ON public.votes(created_at);

-- Insert some sample data (approved people for testing)
INSERT INTO public.people (name, photo_url, is_approved, moderation_status) VALUES
('Alex Johnson', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face', true, 'approved'),
('Sarah Chen', 'https://images.unsplash.com/photo-1494790108755-2616b4a7ad8b?w=400&h=400&fit=crop&crop=face', true, 'approved'),
('Michael Rodriguez', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face', true, 'approved'),
('Emma Wilson', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face', true, 'approved'),
('David Kim', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face', true, 'approved'),
('Lisa Brown', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face', true, 'approved');