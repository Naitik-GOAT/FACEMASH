import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Upload, ArrowLeft, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Person {
  id: string;
  name: string;
  photo_url: string;
  rating: number;
  total_votes: number;
  wins: number;
  losses: number;
}

interface Photo {
  id: string;
  person_id: string;
  image_url: string;
  created_at: string;
}

interface PersonProfileProps {
  person: Person | null;
  isOpen: boolean;
  onClose: () => void;
}

const PersonProfile = ({ person, isOpen, onClose }: PersonProfileProps) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (person && isOpen) {
      fetchPhotos();
    }
  }, [person, isOpen]);

  const fetchPhotos = async () => {
    if (!person) return;
    
    setLoading(true);
    try {
      // First, get all people with the same name
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select('id')
        .eq('name', person.name)
        .eq('is_approved', true);

      if (peopleError) throw peopleError;
      
      const personIds = peopleData?.map(p => p.id) || [person.id];
      
      // Then fetch photos for all people with this name
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .in('person_id', personIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast({
        title: "Error",
        description: "Failed to load photos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !person) return;

    setUploading(true);
    try {
      // Get the primary person ID for this name (highest rated one)
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select('id, rating')
        .eq('name', person.name)
        .eq('is_approved', true)
        .order('rating', { ascending: false })
        .limit(1);

      if (peopleError) throw peopleError;
      
      const primaryPersonId = peopleData?.[0]?.id || person.id;
      
      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${person.name}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('person-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('person-photos')
        .getPublicUrl(uploadData.path);

      // Save to photos table using the primary person ID
      const { error: insertError } = await supabase
        .from('photos')
        .insert({
          person_id: primaryPersonId,
          image_url: publicUrl
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Photo uploaded successfully"
      });

      // Refresh photos
      fetchPhotos();
      setShowUploadForm(false);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  if (!person) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <DialogTitle className="text-2xl font-bold">{person.name}</DialogTitle>
              <p className="text-muted-foreground">
                Rating: {person.rating} • {person.total_votes} votes • {Math.round((person.wins / Math.max(person.total_votes, 1)) * 100)}% win rate
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          {/* Photos Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-12 mb-6">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No photos yet</h3>
              <p className="text-muted-foreground mb-4">Be the first to add a photo for {person.name}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {photos.map((photo) => (
                <div key={photo.id} className="aspect-square overflow-hidden rounded-lg bg-muted">
                  <img
                    src={photo.image_url}
                    alt={`Photo of ${person.name}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                    onClick={() => window.open(photo.image_url, '_blank')}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Add Photo Button */}
          {!loading && !showUploadForm && (
            <div className="text-center">
              <Button 
                onClick={() => setShowUploadForm(true)} 
                variant="outline" 
                className="mb-4"
              >
                <Upload className="h-4 w-4 mr-2" />
                Add Photo
              </Button>
            </div>
          )}

          {/* Upload Form */}
          {showUploadForm && (
            <div className="p-4 border border-dashed border-border rounded-lg">
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="flex-1"
                  id="photo-upload"
                />
                <Button disabled={uploading} asChild>
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload'}
                  </label>
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowUploadForm(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PersonProfile;