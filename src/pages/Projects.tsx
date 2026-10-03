import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProjectDetailDialog from "@/components/ProjectDetailDialog";
import { ProjectCard } from "@/components/ProjectCard";
import { CardSkeleton, LoadingAnnouncer, SectionNotice } from "@/components/CardSkeleton";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cms } from "@/integrations/cpanel/client";
import { categoryName, useProjectCategories, type Project } from "@/lib/projects";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [params, setParams] = useSearchParams();
  const { categories } = useProjectCategories();

  const active = params.get("category") ?? "all";
  const openSlug = params.get("project");
  const selected = projects.find((p) => p.slug === openSlug) ?? null;

  useEffect(() => {
    document.title = "All Projects — Tobiya Game Studio";
    window.scrollTo(0, 0);
    cms
      .from("projects")
      .select("*")
      .order("display_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) setLoadError(true);
        else setProjects(data ?? []);
        setLoading(false);
      });
  }, []);

  // Only show filters for categories that have at least one project, in admin-defined order.
  const filters = useMemo(() => {
    const used = new Set(projects.map((p) => p.category));
    const known = categories.filter((c) => used.has(c.slug));
    const unknown = [...used].filter((slug) => !categories.some((c) => c.slug === slug)).map((slug) => ({ slug, name: categoryName(categories, slug) }));
    return [{ slug: "all", name: "All" }, ...known, ...unknown];
  }, [projects, categories]);

  const visible = active === "all" ? projects : projects.filter((p) => p.category === active);

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: key === "category" });
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header>
        <Navbar />
      </header>

      <main id="main" className="pt-28 pb-20">
        <section className="container mx-auto px-4 sm:px-6">
          <Link to="/#works" className="mb-8 inline-flex items-center gap-2 rounded-md text-muted-foreground transition-colors hover:text-primary focus-ring">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to home
          </Link>

          <div className="mb-10 max-w-3xl">
            <Eyebrow className="mb-4">Portfolio</Eyebrow>
            <h1 className="font-display text-display-lg font-bold mb-4 text-balance">
              All <span className="gradient-text">Projects</span>
            </h1>
            <p className="text-body-lg text-muted-foreground text-pretty">
              Every world we've built — tap a project to see the story, screenshots and videos.
            </p>
          </div>

          {filters.length > 2 && (
            <div role="group" aria-label="Filter projects by category" className="mb-10 flex flex-wrap gap-2 md:gap-3">
              {filters.map((c) => {
                const isActive = active === c.slug;
                const count = c.slug === "all" ? projects.length : projects.filter((p) => p.category === c.slug).length;
                return (
                  <button
                    key={c.slug}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => update("category", c.slug === "all" ? null : c.slug)}
                    className={cn(
                      "min-h-[44px] rounded-full px-5 text-sm font-medium capitalize transition-all duration-300 focus-ring",
                      isActive
                        ? "bg-primary text-primary-foreground glow-primary"
                        : "border border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
                    )}
                  >
                    {c.name} <span className="opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {loading && (
            <>
              <LoadingAnnouncer label="Loading projects" />
              <div className="grid gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            </>
          )}

          {!loading && loadError && (
            <SectionNotice title="Projects are taking a moment to load" description="Please refresh the page and try again." />
          )}

          {!loading && !loadError && visible.length === 0 && (
            <SectionNotice title="Nothing here yet" description="No projects in this category yet — try another filter." />
          )}

          {!loading && !loadError && visible.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {visible.map((project, index) => (
                  <motion.li
                    key={project.id}
                    layout
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.35, delay: Math.min(0.04 * index, 0.3) }}
                  >
                    <ProjectCard
                      project={project}
                      categoryLabel={categoryName(categories, project.category)}
                      onOpen={() => update("project", project.slug)}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </section>
      </main>

      <ProjectDetailDialog
        project={selected}
        categoryLabel={selected ? categoryName(categories, selected.category) : undefined}
        open={!!selected}
        onOpenChange={(open) => !open && update("project", null)}
      />

      <Footer />
    </div>
  );
}
