import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, X } from "lucide-react";

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
  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* Hero Image */}
        <div className="relative h-48 sm:h-64 md:h-80 overflow-hidden">
          {project.cover_image_url ? (
            <img
              src={project.cover_image_url}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
              <span className="text-4xl font-display text-primary/50">{project.title[0]}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          {/* Category Badge */}
          <div className="absolute top-4 left-4">
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

            {/* Gallery */}
            {project.gallery_images && project.gallery_images.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Gallery</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {project.gallery_images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${project.title} gallery ${index + 1}`}
                      className="w-full h-24 sm:h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Video */}
            {project.video_url && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Video</h4>
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <iframe
                    src={project.video_url}
                    className="w-full h-full"
                    allowFullScreen
                    title={project.title}
                  />
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
