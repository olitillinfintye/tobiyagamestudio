import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cms } from "@/integrations/cpanel/client";
import ProjectDetailDialog from "./ProjectDetailDialog";
import { SectionHeader } from "./SectionHeader";
import { CardSkeleton, LoadingAnnouncer, SectionNotice } from "./CardSkeleton";
import { categoryName, projectMedia, useProjectCategories, type Project } from "@/lib/projects";

const SELECTED_LIMIT = 5;

const placeholderBg = [
  "radial-gradient(circle at 30% 30%,#8b5cf6,transparent 60%),linear-gradient(135deg,#1e1b4b,#0f172a)",
  "radial-gradient(circle at 70% 40%,#22e4f0,transparent 55%),linear-gradient(135deg,#042f2e,#0b1120)",
  "conic-gradient(from 200deg at 60% 50%,#0e7490,#5b21b6,#b45309,#0e7490)",
  "radial-gradient(circle at 20% 80%,#ffc23d,transparent 45%),linear-gradient(135deg,#1c1917,#0b1120)",
];

export default function Portfolio() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);
  const { categories } = useProjectCategories();

  useEffect(() => {
    cms
      .from("projects")
      .select("*")
      .order("display_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          // Surface the failure rather than silently rendering placeholder data.
          console.error("Failed to load projects:", error);
          setLoadError(true);
        } else setProjects(data ?? []);
        setLoading(false);
      });
  }, []);

  // Admins pick "Selected Works" with the featured switch; fall back to the first few.
  const featured = projects.filter((p) => p.featured);
  const shown = (featured.length ? featured : projects).slice(0, SELECTED_LIMIT);

  return (
    <section id="works" aria-labelledby="works-heading" className="section-padding relative">
      <div className="container mx-auto px-5">
        <SectionHeader
          id="works-heading"
          eyebrow="Selected works"
          title={
            <>
              Worlds we've
              <br />
              <span className="gradient-text">shipped.</span>
            </>
          }
          action={
            <Link to="/projects" className="vr-btn-ghost inline-flex h-12 items-center self-start rounded-xl px-6 text-sm font-semibold md:self-auto focus-ring">
              View all projects{projects.length > shown.length ? ` (${projects.length})` : ""} →
            </Link>
          }
        />

        {loading && (
          <>
            <LoadingAnnouncer label="Loading projects" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </>
        )}

        {!loading && loadError && (
          <SectionNotice title="Our work is taking a moment to load" description="Please refresh the page, or reach out and we'll send our portfolio directly." />
        )}

        {!loading && !loadError && shown.length === 0 && <SectionNotice title="Nothing here yet" description="New projects are on the way." />}

        {!loading && !loadError && shown.length > 0 && (
          <ul className="vr-bento">
            {shown.map((project, index) => {
              const videos = projectMedia(project).filter((m) => m.type === "video").length;
              return (
                <motion.li
                  key={project.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.8, delay: (index % 4) * 0.08, ease: [0.2, 0.7, 0.2, 1] }}
                >
                  <button type="button" className="vr-work focus-ring" onClick={() => setSelected(project)} aria-label={`Open ${project.title}`}>
                    {project.cover_image_url ? (
                      <img className="bg" src={project.cover_image_url} alt="" loading="lazy" decoding="async" />
                    ) : (
                      <span className="bg" style={{ background: placeholderBg[index % placeholderBg.length] }} />
                    )}
                    <span className="absolute left-5 top-5 flex gap-1.5">
                      <span className="vr-tag mono">{categoryName(categories, project.category)}</span>
                      {videos > 0 && <span className="vr-tag mono">▶ {videos}</span>}
                    </span>
                    <span className="absolute inset-x-6 bottom-5 flex items-end justify-between gap-4">
                      <span className="min-w-0">
                        {index === 0 && <span className="mono block text-primary">Featured</span>}
                        <span className={`mt-2 block font-semibold leading-tight ${index === 0 ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"}`}>{project.title}</span>
                        {index === 0 && project.short_description && (
                          <span className="mt-2 line-clamp-2 block max-w-xl text-sm text-muted-foreground">{project.short_description}</span>
                        )}
                      </span>
                      <span className="arrow" aria-hidden="true">→</span>
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>

      <ProjectDetailDialog
        project={selected}
        categoryLabel={selected ? categoryName(categories, selected.category) : undefined}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </section>
  );
}
