import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Check, AlertCircle } from 'lucide-react';

import Navigation from "@/components/Navigation";

const Submit = () => {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      if (!selectedFile.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }
      
      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name",
        variant: "destructive"
      });
      return;
    }
    
    if (!file) {
      toast({
        title: "Photo required",
        description: "Please select a photo to upload",
        variant: "destructive"
      });
      return;
    }
    
    setUploading(true);
    
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);
      
      // Insert person record
      const { error: insertError } = await supabase
        .from('people')
        .insert({
          name: name.trim(),
          photo_url: urlData.publicUrl,
          is_approved: false, // Requires moderation
          moderation_status: 'pending'
        });
      
      if (insertError) throw insertError;
      
      toast({
        title: "Submission successful!",
        description: "Your photo has been submitted for review. It will appear in comparisons once approved.",
      });
      
      // Reset form
      setName('');
      setFile(null);
      setPreview(null);
      
    } catch (error) {
      console.error('Error submitting:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your photo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2">Submit Your Photo</h1>
              <p className="text-muted-foreground">
                Add yourself to the comparison! Your photo will be reviewed before going live.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload size={24} />
                  Upload Photo
                </CardTitle>
                <CardDescription>
                  Please upload a clear face photo. All submissions are manually reviewed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      disabled={uploading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photo">Photo</Label>
                    <div
                      className="upload-area"
                      onClick={() => document.getElementById('photo')?.click()}
                    >
                      {preview ? (
                        <div className="space-y-4">
                          <img
                            src={preview}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-lg mx-auto"
                          />
                          <p className="text-sm text-muted-foreground">
                            Click to change photo
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Upload size={48} className="mx-auto text-muted-foreground" />
                          <div>
                            <p className="font-medium">Click to upload a photo</p>
                            <p className="text-sm text-muted-foreground">
                              PNG, JPG up to 5MB
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      id="photo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={20} className="text-amber-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">Review Process</p>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• Photos are manually reviewed for appropriateness</li>
                          <li>• Only face photos are accepted</li>
                          <li>• Approval typically takes 24-48 hours</li>
                          <li>• You'll start with a rating of 1200 points</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={uploading || !name.trim() || !file}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Check size={16} className="mr-2" />
                        Submit Photo
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Submit;