import { useState, useEffect } from "react";
import { cms } from "@/integrations/cpanel/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Star, Tags, Video } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { GalleryUpload } from "./GalleryUpload";
import { SortableItem } from "./SortableItem";
import { ProjectCategoriesManager } from "./ProjectCategoriesManager";
import { slugify } from "@/lib/products";
import { categoryName, type Project, type ProjectCategory } from "@/lib/projects";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";

type FormState = {
  title: string;
  slug: string;
  category: string;
  short_description: string;
  full_description: string;
  cover_image_url: string;
  videos: string[];
  tools_used: string;
  project_link: string;
  featured: boolean;
  gallery_images: string[];
};

const emptyForm = (category = ""): FormState => ({
  title: "",
  slug: "",
  category,
  short_description: "",
  full_description: "",
  cover_image_url: "",
  videos: [],
  tools_used: "",
  project_link: "",
  featured: false,
  gallery_images: [],
});

export function ProjectsManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [formData, setFormData] = useState<FormState>(emptyForm());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    fetchProjects();
    fetchCategories();
  }, []);

  const fetchProjects = async () => {
    const { data } = await cms.from("projects").select("*").order("display_order");
    if (data) setProjects(data);
  };

  const fetchCategories = async () => {
    const { data } = await cms.from("project_categories").select("*").order("display_order");
    if (data) setCategories(data);
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setFormData((f) => ({ ...f, [key]: value }));
  const featuredCount = projects.filter((p) => p.featured).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      toast.error("Choose a category (add one under Categories if needed).");
      return;
    }
    const videos = formData.videos.map((v) => v.trim()).filter(Boolean);
    const projectData = {
      title: formData.title.trim(),
      slug: formData.slug,
      category: formData.category,
      short_description: formData.short_description,
      full_description: formData.full_description,
      cover_image_url: formData.cover_image_url,
      video_url: videos[0] ?? null,
      video_urls: videos.slice(1),
      project_link: formData.project_link,
      featured: formData.featured,
      tools_used: formData.tools_used.split(",").map((t) => t.trim()).filter(Boolean),
      gallery_images: formData.gallery_images,
    };

    if (editingProject) {
      const { error } = await cms.from("projects").update(projectData).eq("id", editingProject.id);
      if (error) toast.error(error.message);
      else { toast.success("Project updated!"); resetForm(); fetchProjects(); }
    } else {
      const maxOrder = projects.reduce((max, p) => Math.max(max, p.display_order || 0), 0);
      const { error } = await cms.from("projects").insert({ ...projectData, display_order: maxOrder + 1 });
      if (error) toast.error(error.message);
      else { toast.success("Project created!"); resetForm(); fetchProjects(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    const { error } = await cms.from("projects").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted!"); fetchProjects(); }
  };

  const toggleFeatured = async (project: Project) => {
    const { error } = await cms.from("projects").update({ featured: !project.featured }).eq("id", project.id);
    if (error) toast.error(error.message);
    else fetchProjects();
  };

  const resetForm = () => {
    setFormData(emptyForm(categories[0]?.slug));
    setEditingProject(null);
    setShowForm(false);
    setSlugTouched(false);
  };

  const startCreate = () => {
    setFormData(emptyForm(categories[0]?.slug));
    setEditingProject(null);
    setSlugTouched(false);
    setShowForm(true);
  };

  const startEdit = (project: Project) => {
    setEditingProject(project);
    setSlugTouched(true);
    setFormData({
      title: project.title,
      slug: project.slug,
      category: project.category,
      short_description: project.short_description || "",
      full_description: project.full_description || "",
      cover_image_url: project.cover_image_url || "",
      videos: [project.video_url, ...(project.video_urls ?? [])].filter((v): v is string => !!v),
      tools_used: project.tools_used?.join(", ") || "",
      project_link: project.project_link || "",
      featured: project.featured || false,
      gallery_images: project.gallery_images || [],
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const newProjects = arrayMove(
      projects,
      projects.findIndex((p) => p.id === active.id),
      projects.findIndex((p) => p.id === over.id),
    );
    setProjects(newProjects);
    for (const [index, project] of newProjects.entries()) {
      await cms.from("projects").update({ display_order: index }).eq("id", project.id);
    }
    toast.success("Project order updated!");
  };

  // Keep a category that is no longer in the list selectable so editing doesn't silently change it.
  const categoryOptions =
    formData.category && !categories.some((c) => c.slug === formData.category)
      ? [...categories, { id: formData.category, slug: formData.category, name: formData.category } as ProjectCategory]
      : categories;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Projects</h2>
          <p className="text-sm text-muted-foreground">
            ★ = shown in Selected Works on the home page ({featuredCount} selected). All projects appear on the All Projects page.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCategories((s) => !s)} aria-expanded={showCategories}>
            <Tags className="w-4 h-4 mr-2" /> Categories
          </Button>
          <Button onClick={startCreate} className="glow-primary">
            <Plus className="w-4 h-4 mr-2" /> Add Project
          </Button>
        </div>
      </div>

      {showCategories && <ProjectCategoriesManager categories={categories} projects={projects} onChange={fetchCategories} />}

      {showForm && (
        <div className="glass-card p-6">
          <h3 className="font-display text-lg font-bold mb-4">{editingProject ? "Edit Project" : "New Project"}</h3>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-title">Title</Label>
              <Input
                id="project-title"
                value={formData.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setFormData((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
                }}
                required
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-slug">URL slug</Label>
              <Input
                id="project-slug"
                value={formData.slug}
                onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }}
                required
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button type="button" className="text-xs text-primary hover:underline" onClick={() => setShowCategories(true)}>
                + Add or edit categories
              </button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-link">Project link (optional)</Label>
              <Input
                id="project-link"
                placeholder="https://…"
                value={formData.project_link}
                onChange={(e) => set("project_link", e.target.value)}
                className="bg-background/50"
              />
              <div className="flex items-center gap-3 pt-3">
                <Switch id="project-featured" checked={formData.featured} onCheckedChange={(v) => set("featured", v)} />
                <Label htmlFor="project-featured">Show in Selected Works (home page)</Label>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Cover image</Label>
              <ImageUpload value={formData.cover_image_url} onChange={(url) => set("cover_image_url", url)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="project-short">Short description (shown on the card)</Label>
              <Textarea
                id="project-short"
                value={formData.short_description}
                onChange={(e) => set("short_description", e.target.value)}
                rows={2}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="project-full">Full description (shown in the popup)</Label>
              <Textarea
                id="project-full"
                value={formData.full_description}
                onChange={(e) => set("full_description", e.target.value)}
                rows={6}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="project-tools">Tools (comma-separated)</Label>
              <Input
                id="project-tools"
                placeholder="Unity, Meta XR SDK, Blender"
                value={formData.tools_used}
                onChange={(e) => set("tools_used", e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Videos (YouTube, Vimeo or video file URL)</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => set("videos", [...formData.videos, ""])}>
                  <Plus className="w-4 h-4 mr-1" /> Add video
                </Button>
              </div>
              {formData.videos.length === 0 && <p className="text-sm text-muted-foreground">No videos yet. The first video is shown first in the popup.</p>}
              {formData.videos.map((video, index) => (
                <div key={index} className="flex gap-2">
                  <Video className="w-4 h-4 mt-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <Input
                    type="url"
                    placeholder="https://youtube.com/watch?v=…"
                    aria-label={`Video ${index + 1} URL`}
                    value={video}
                    onChange={(e) => set("videos", formData.videos.map((v, i) => (i === index ? e.target.value : v)))}
                    className="flex-1 bg-background/50"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove video ${index + 1}`}
                    onClick={() => set("videos", formData.videos.filter((_, i) => i !== index))}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Slide images (gallery)</Label>
              <GalleryUpload images={formData.gallery_images} onChange={(urls) => set("gallery_images", urls)} />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit">{editingProject ? "Update" : "Create"}</Button>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Drag and drop projects to reorder them on the site.</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="grid gap-3">
              {projects.map((project) => {
                const videoCount = [project.video_url, ...(project.video_urls ?? [])].filter(Boolean).length;
                return (
                  <SortableItem key={project.id} id={project.id}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between flex-1 ml-2 gap-3">
                      <div className="flex items-center gap-4 min-w-0">
                        {project.cover_image_url ? (
                          <img src={project.cover_image_url} alt="" className="w-16 h-16 object-cover rounded shrink-0" />
                        ) : (
                          <div className="w-16 h-16 rounded bg-muted shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold truncate">{project.title}</h3>
                            <Badge variant="outline">{categoryName(categories, project.category)}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {videoCount} video(s) • {(project.gallery_images?.length ?? 0)} image(s)
                            {project.short_description ? ` • ${project.short_description}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant={project.featured ? "default" : "outline"}
                          onClick={() => toggleFeatured(project)}
                          aria-pressed={!!project.featured}
                          title={project.featured ? "Remove from Selected Works" : "Add to Selected Works"}
                        >
                          <Star className={`w-4 h-4 ${project.featured ? "fill-current" : ""}`} />
                          <span className="sr-only">Selected Works</span>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => startEdit(project)} aria-label="Edit">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(project.id)} aria-label="Delete">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </SortableItem>
                );
              })}
              {projects.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No projects yet. Add your first project!</p>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
