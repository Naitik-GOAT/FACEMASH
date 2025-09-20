-- Create photos table for person galleries
CREATE TABLE public.photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Create policies for photos
CREATE POLICY "Anyone can view photos" 
ON public.photos 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert photos" 
ON public.photos 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update photos" 
ON public.photos 
FOR UPDATE 
USING (true);

-- Create storage bucket for person photos
INSERT INTO storage.buckets (id, name, public) VALUES ('person-photos', 'person-photos', true);

-- Create storage policies
CREATE POLICY "Anyone can view person photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'person-photos');

CREATE POLICY "Anyone can upload person photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'person-photos');

CREATE POLICY "Anyone can update person photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'person-photos');

-- Add index for better performance
CREATE INDEX idx_photos_person_id ON public.photos(person_id);

-- Enable real-time for photos table
ALTER TABLE public.photos REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.photos;