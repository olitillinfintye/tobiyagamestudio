import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

interface Project {
  id: string;
  title: string;
  slug: string;
  category: string;
  short_description: string | null;
  full_description?: string | null;
  cover_image_url: string | null;
  gallery_images?: string[] | null;
  video_url: string | null;
  tools_used: string[] | null;
  project_link: string | null;
  featured: boolean | null;
}

interface ProjectDetailDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProjectDetailDialog({ project, open, onOpenChange }: ProjectDetailDialogProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!project) return null;

  // Combine cover image with gallery images for carousel
  const allImages = [
    ...(project.cover_image_url ? [project.cover_image_url] : []),
    ...(project.gallery_images || []),
  ];

  const hasMultipleImages = allImages.length > 1;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % allImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setCurrentSlide(0);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* Hero Image Carousel */}
        <div className="relative h-48 sm:h-64 md:h-80 overflow-hidden">
          {allImages.length > 0 ? (
            <>
              <img
                src={allImages[currentSlide]}
                alt={`${project.title} - Image ${currentSlide + 1}`}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              
              {/* Navigation Arrows */}
              {hasMultipleImages && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 hover:bg-background shadow-lg z-10"
                    onClick={prevSlide}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 hover:bg-background shadow-lg z-10"
                    onClick={nextSlide}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}
              
              {/* Slide Counter */}
              {hasMultipleImages && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-sm font-medium z-10">
                  {currentSlide + 1} / {allImages.length}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
              <span className="text-4xl font-display text-primary/50">{project.title[0]}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none" />
          
          {/* Category Badge */}
          <div className="absolute top-4 left-4 z-10">
            <Badge variant="secondary" className="capitalize">
              {project.category}
            </Badge>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl sm:text-2xl md:text-3xl font-bold">
              {project.title}
            </DialogTitle>
          </DialogHeader>

          {/* Description */}
          <div className="mt-4 space-y-4">
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {project.full_description || project.short_description}
            </p>

            {/* Tools Used */}
            {project.tools_used && project.tools_used.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Tools & Technologies</h4>
                <div className="flex flex-wrap gap-2">
                  {project.tools_used.map((tool) => (
                    <Badge key={tool} variant="outline" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Thumbnail Gallery Strip */}
            {hasMultipleImages && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Gallery</h4>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentSlide(idx)}
                      className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden border-2 transition-all ${
                        idx === currentSlide 
                          ? "border-primary ring-2 ring-primary/30" 
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img 
                        src={img} 
                        alt={`Thumbnail ${idx + 1}`} 
                        className="w-full h-full object-cover" 
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Video */}
            {project.video_url && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Video</h4>
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  {project.video_url.includes('youtube.com') || project.video_url.includes('youtu.be') ? (
                    <iframe
                      src={project.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      title={project.title}
                    />
                  ) : project.video_url.includes('vimeo.com') ? (
                    <iframe
                      src={project.video_url.replace('vimeo.com/', 'player.vimeo.com/video/').split('?')[0]}
                      className="w-full h-full"
                      allowFullScreen
                      allow="autoplay; fullscreen; picture-in-picture"
                      title={project.title}
                    />
                  ) : (
                    <video
                      src={project.video_url}
                      className="w-full h-full"
                      controls
                      title={project.title}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Project Link */}
            {project.project_link && (
              <Button asChild className="w-full sm:w-auto mt-4">
                <a
                  href={project.project_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  View Live Project <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
