import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Play, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cms } from "@/integrations/cpanel/client";
import ProjectDetailDialog from "./ProjectDetailDialog";
import { SectionHeader } from "./SectionHeader";
import { CardSkeleton, LoadingAnnouncer, SectionNotice } from "./CardSkeleton";
import { cn } from "@/lib/utils";

const getEmbedUrl = (url: string) => {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/");
  }
  if (url.includes("vimeo.com")) {
    return url.replace("vimeo.com/", "player.vimeo.com/video/").split("?")[0];
  }
  return url;
};

/**
 * Tool lists arrive from the CMS inconsistently — sometimes as separate entries
 * ("Unity", "Meta XR SDK"), sometimes as one delimited string
 * ("Unity - MetaSDK - Convai"). Normalise both into individual tags.
 */
const normaliseTools = (tools: string[] | null): string[] => {
  if (!tools) return [];
  return tools
    .flatMap((tool) => tool.split(/\s*[-–—|/]\s*/))
    .map((tool) => tool.trim())
    .filter(Boolean);
};

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

const categories = [
  { id: "all", label: "All" },
  { id: "vr", label: "VR Projects" },
  { id: "ar", label: "AR Projects" },
  { id: "interactive", label: "Interactive" },
  { id: "award", label: "Awards" },
];

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [videoProject, setVideoProject] = useState<Project | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await cms
          .from("projects")
          .select("*")
          .order("display_order", { ascending: true });

        if (error) throw error;
        setProjects(data ?? []);
      } catch (error) {
        // Surface the failure rather than silently rendering placeholder data.
        console.error("Failed to load projects:", error);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects =
    activeCategory === "all" ? projects : projects.filter((p) => p.category === activeCategory);

  return (
    <section id="works" aria-labelledby="works-heading" className="section-padding relative">
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        <SectionHeader
          id="works-heading"
          eyebrow="Portfolio"
          title={
            <>
              Our <span className="gradient-text">Works</span>
            </>
          }
          description="Explore our portfolio of VR, AR, and interactive experiences that push the boundaries of what's possible."
        />

        {/* Category filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          role="group"
          aria-label="Filter projects by category"
          className="flex flex-wrap justify-center gap-2 md:gap-3 mb-10 md:mb-12"
        >
          {categories.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                aria-pressed={isActive}
                className={cn(
                  "min-h-[44px] rounded-full px-5 text-sm font-medium transition-all duration-300 focus-ring",
                  isActive
                    ? "bg-primary text-primary-foreground glow-primary"
                    : "bg-card border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {category.label}
              </button>
            );
          })}
        </motion.div>

        {loading && (
          <>
            <LoadingAnnouncer label="Loading projects" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </>
        )}

        {!loading && loadError && (
          <SectionNotice
            title="Our work is taking a moment to load"
            description="Please refresh the page, or reach out and we'll send our portfolio directly."
          />
        )}

        {!loading && !loadError && filteredProjects.length === 0 && (
          <SectionNotice
            title="Nothing here yet"
            description={
              activeCategory === "all"
                ? "New projects are on the way."
                : "No projects in this category yet — try another filter."
            }
          />
        )}

        {!loading && !loadError && filteredProjects.length > 0 && (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, index) => (
                <motion.li
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, delay: Math.min(0.06 * index, 0.3) }}
                  className="glass-card flex flex-col overflow-hidden group project-card"
                >
                  {/* Consistent 16:10 media plate. The ring keeps renders that
                      ship with their own background reading as intentional. */}
                  <div className="relative aspect-[16/10] overflow-hidden ring-1 ring-inset ring-border/60">
                    {project.cover_image_url ? (
                      <img
                        src={project.cover_image_url}
                        alt=""
                        width={800}
                        height={500}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                        <span className="text-3xl font-display text-primary/50" aria-hidden="true">
                          {project.title[0]}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card/90 to-transparent" />

                    <div className="absolute top-3 left-3">
                      <span className={`category-pill ${project.category}`}>{project.category}</span>
                    </div>

                    {project.video_url && (
                      <button
                        type="button"
                        onClick={() => {
                          setVideoProject(project);
                          setVideoOpen(true);
                        }}
                        aria-label={`Play video for ${project.title}`}
                        className="absolute inset-0 flex items-center justify-center bg-background/30 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-ring"
                      >
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 transition-transform hover:scale-110">
                          <Play className="w-6 h-6 text-primary-foreground ml-1" aria-hidden="true" />
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-4 md:p-5">
                    <h3 className="font-display text-base md:text-lg font-bold mb-2 line-clamp-2 transition-colors group-hover:text-primary">
                      {project.title}
                    </h3>

                    {project.short_description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 text-pretty">
                        {project.short_description}
                      </p>
                    )}

                    {normaliseTools(project.tools_used).length > 0 && (
                      <ul className="mb-4 flex flex-wrap gap-1.5">
                        {normaliseTools(project.tools_used)
                          .slice(0, 4)
                          .map((tool) => (
                            <li
                              key={tool}
                              className="rounded border border-border/60 bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                            >
                              {tool}
                            </li>
                          ))}
                      </ul>
                    )}

                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedProject(project);
                        setDialogOpen(true);
                      }}
                      className="mt-auto min-h-[44px] w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" aria-hidden="true" />
                      View details
                      <span className="sr-only"> for {project.title}</span>
                    </Button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <ProjectDetailDialog project={selectedProject} open={dialogOpen} onOpenChange={setDialogOpen} />

      <Dialog
        open={videoOpen}
        onOpenChange={(open) => {
          setVideoOpen(open);
          if (!open) setVideoProject(null);
        }}
      >
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">{videoProject?.title || "Project video"}</DialogTitle>
          {videoProject?.video_url && (
            <div className="aspect-video bg-background">
              {videoProject.video_url.includes("youtube.com") ||
              videoProject.video_url.includes("youtu.be") ||
              videoProject.video_url.includes("vimeo.com") ? (
                <iframe
                  src={getEmbedUrl(videoProject.video_url)}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title={videoProject.title}
                />
              ) : (
                <video
                  src={videoProject.video_url}
                  className="w-full h-full"
                  controls
                  autoPlay
                  title={videoProject.title}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
