import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { getEmbedUrl } from "@/lib/products";
import { normaliseTools, projectMedia, type Media, type Project } from "@/lib/projects";
import { cn } from "@/lib/utils";

interface ProjectDetailDialogProps {
  project: Project | null;
  categoryLabel?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Slide({ media, title, index }: { media: Media; title: string; index: number }) {
  if (media.type === "image") {
    return <img src={media.src} alt={`${title} — image ${index + 1}`} className="h-full w-full object-contain bg-black" />;
  }
  const embed = getEmbedUrl(media.src);
  return embed.kind === "iframe" ? (
    <iframe
      src={embed.src}
      className="h-full w-full"
      allowFullScreen
      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      title={`${title} — video`}
    />
  ) : (
    <video src={embed.src} className="h-full w-full bg-black" controls playsInline title={`${title} — video`} />
  );
}

function youtubeThumb(src: string) {
  const embed = getEmbedUrl(src);
  const id = embed.src.match(/youtube\.com\/embed\/([^?&]+)/)?.[1];
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

export default function ProjectDetailDialog({ project, categoryLabel, open, onOpenChange }: ProjectDetailDialogProps) {
  const [current, setCurrent] = useState(0);
  const media = project ? projectMedia(project) : [];
  const count = media.length;

  useEffect(() => setCurrent(0), [project?.id]);

  const go = useCallback((delta: number) => count && setCurrent((i) => (i + delta + count) % count), [count]);

  if (!project) return null;
  const tools = normaliseTools(project.tools_used);
  // Collapse runs of blank lines pasted in from editors.
  const description = (project.full_description || project.short_description || "").replace(/\n\s*\n\s*\n+/g, "\n\n").trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="block max-w-5xl w-[calc(100vw-1.5rem)] max-h-[92vh] overflow-y-auto p-0"
        onKeyDown={(e) => {
          if ((e.target as HTMLElement).closest("input, textarea, iframe, video")) return;
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
      >
        {/* Media stage. Padded so the dialog's close button and the slider controls
            never sit on top of the video player's own controls. */}
        <header className="flex items-center gap-3 px-4 pb-4 pr-14 pt-5 sm:px-6 sm:pr-16">
          {categoryLabel && (<Badge variant="secondary" className="mono shrink-0">{categoryLabel}</Badge>)}
          <DialogTitle className="min-w-0 truncate font-display text-xl font-semibold sm:text-2xl">{project.title}</DialogTitle>
        </header>

        <div className="px-4 sm:px-6">
          <div className="relative aspect-video overflow-hidden rounded-xl border border-border/60 bg-black">
            {count > 0 ? (
              // Keyed so a playing video stops when the slide changes
              <Slide key={current} media={media[current]} title={project.title} index={current} />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary">
                <span className="font-display text-5xl text-primary/50" aria-hidden="true">{project.title[0]}</span>
              </div>
            )}
          </div>

          {count > 1 && (
            <div className="mt-3 flex items-center gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full"
                aria-label="Previous slide"
                title="Previous slide"
                onClick={() => go(-1)}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto py-1">
                {media.map((m, idx) => {
                  const thumb = m.type === "image" ? m.src : youtubeThumb(m.src);
                  return (
                    <button
                      key={`${m.src}-${idx}`}
                      type="button"
                      onClick={() => setCurrent(idx)}
                      aria-label={`Show ${m.type} ${idx + 1}`}
                      aria-current={idx === current}
                      className={cn(
                        "relative h-14 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all focus-ring sm:h-16 sm:w-28",
                        idx === current ? "border-primary" : "border-transparent opacity-60 hover:opacity-100",
                      )}
                    >
                      {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" /> : <span className="block h-full w-full bg-secondary" />}
                      {m.type === "video" && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Play className="h-5 w-5 text-white" aria-hidden="true" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <span className="mono shrink-0 text-muted-foreground" aria-live="polite">
                {current + 1}/{count}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full"
                aria-label="Next slide"
                title="Next slide"
                onClick={() => go(1)}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
        <div className="px-4 pb-7 pt-6 sm:px-6 sm:pb-8">
          {description ? (
            <DialogDescription asChild>
              <div className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed text-muted-foreground">{description}</div>
            </DialogDescription>
          ) : (
            <DialogDescription className="sr-only">Project details</DialogDescription>
          )}

          {tools.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-2">Tools &amp; Technologies</h3>
              <ul className="flex flex-wrap gap-2">
                {tools.map((tool) => (
                  <li key={tool}>
                    <Badge variant="outline" className="text-xs">{tool}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {project.project_link && (
            <Button asChild className="mt-6 w-full sm:w-auto">
              <a href={project.project_link} target="_blank" rel="noopener noreferrer">
                View live project <ExternalLink className="w-4 h-4 ml-2" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
