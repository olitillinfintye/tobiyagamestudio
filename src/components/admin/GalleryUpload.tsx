import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface GalleryUploadProps {
  images: string[];
  onChange: (urls: string[]) => void;
  bucket?: string;
}

export function GalleryUpload({ images, onChange, bucket = "project-images" }: GalleryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) {
        toast.error(`Upload failed for ${file.name}: ${uploadError.message}`);
        continue;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      newUrls.push(data.publicUrl);
    }

    if (newUrls.length > 0) {
      onChange([...images, ...newUrls]);
      toast.success(`${newUrls.length} image(s) uploaded!`);
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
    if (currentSlide >= newImages.length && newImages.length > 0) {
      setCurrentSlide(newImages.length - 1);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="cursor-pointer flex-1">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
          <Button type="button" variant="outline" className="w-full" disabled={uploading} asChild>
            <span className="flex items-center gap-2">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? "Uploading..." : "Upload Gallery Images"}
            </span>
          </Button>
        </label>
        
        {images.length > 0 && (
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="secondary" className="flex items-center gap-2">
                <Images className="w-4 h-4" />
                Preview ({images.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Gallery Preview</DialogTitle>
              </DialogHeader>
              <div className="relative">
                {/* Main Image */}
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src={images[currentSlide]}
                    alt={`Slide ${currentSlide + 1}`}
                    className="w-full h-full object-contain"
                  />
                  
                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 hover:bg-background"
                        onClick={prevSlide}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 hover:bg-background"
                        onClick={nextSlide}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </>
                  )}
                  
                  {/* Slide Counter */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-sm">
                    {currentSlide + 1} / {images.length}
                  </div>
                </div>

                {/* Thumbnail Strip */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentSlide(idx)}
                      className={`relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                        idx === currentSlide ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Thumbnail Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {images.map((img, idx) => (
            <div key={idx} className="relative group aspect-square rounded-md overflow-hidden border border-border">
              <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
