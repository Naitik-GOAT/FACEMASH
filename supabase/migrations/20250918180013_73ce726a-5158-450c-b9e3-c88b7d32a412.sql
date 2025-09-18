-- Add RLS policy to allow updating people ratings
CREATE POLICY "Allow rating updates for people" ON public.people
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Enable realtime for people table to sync leaderboard updates
ALTER TABLE public.people REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.people;