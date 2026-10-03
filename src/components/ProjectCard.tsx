import { Images, Play } from "lucide-react";
import { normaliseTools, projectMedia, type Project } from "@/lib/projects";

interface ProjectCardProps {
  project: Project;
  categoryLabel: string;
  onOpen: () => void;
}

export function ProjectCard({ project, categoryLabel, onOpen }: ProjectCardProps) {
  const media = projectMedia(project);
  const videos = media.filter((m) => m.type === "video").length;
  const images = media.length - videos;
  const tools = normaliseTools(project.tools_used);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="glass-card group project-card flex h-full w-full flex-col overflow-hidden text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 focus-ring"
      aria-label={`Open ${project.title}`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden ring-1 ring-inset ring-border/60">
        {project.cover_image_url ? (
          <img
            src={project.cover_image_url}
            alt=""
            width={800}
            height={500}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary">
            <span className="font-display text-3xl text-primary/50" aria-hidden="true">{project.title[0]}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card/90 to-transparent" />
        <span className={`category-pill ${project.category} absolute left-3 top-3`}>{categoryLabel}</span>

        <span className="absolute bottom-3 right-3 flex gap-1.5 text-xs">
          {videos > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 backdrop-blur">
              <Play className="h-3 w-3" aria-hidden="true" /> {videos}
            </span>
          )}
          {images > 1 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 backdrop-blur">
              <Images className="h-3 w-3" aria-hidden="true" /> {images}
            </span>
          )}
        </span>

        {videos > 0 && (
          <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90">
              <Play className="ml-1 h-6 w-6 text-primary-foreground" />
            </span>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 md:p-5">
        <h3 className="font-display mb-2 line-clamp-2 text-base font-bold transition-colors group-hover:text-primary md:text-lg">
          {project.title}
        </h3>
        {project.short_description && (
          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground text-pretty">{project.short_description}</p>
        )}
        {tools.length > 0 && (
          <span className="mt-auto flex flex-wrap gap-1.5">
            {tools.slice(0, 4).map((tool) => (
              <span key={tool} className="rounded border border-border/60 bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {tool}
              </span>
            ))}
          </span>
        )}
      </div>
    </button>
  );
}
