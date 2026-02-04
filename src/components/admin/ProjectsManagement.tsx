import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Edit } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { GalleryUpload } from "./GalleryUpload";
import { SortableItem } from "./SortableItem";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

type Project = {
  id: string;
  title: string;
  slug: string;
  category: string;
  short_description: string | null;
  full_description: string | null;
  cover_image_url: string | null;
  video_url: string | null;
  tools_used: string[] | null;
  project_link: string | null;
  featured: boolean | null;
  gallery_images: string[] | null;
  display_order: number | null;
};

export function ProjectsManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    slug: string;
    category: "vr" | "ar" | "interactive" | "award";
    short_description: string;
    full_description: string;
    cover_image_url: string;
    video_url: string;
    tools_used: string;
    project_link: string;
    featured: boolean;
    gallery_images: string[];
  }>({
    title: "",
    slug: "",
    category: "vr",
    short_description: "",
    full_description: "",
    cover_image_url: "",
    video_url: "",
    tools_used: "",
    project_link: "",
    featured: false,
    gallery_images: [],
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data } = await supabase.from("projects").select("*").order("display_order");
    if (data) setProjects(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const projectData = {
      title: formData.title,
      slug: formData.slug,
      category: formData.category,
      short_description: formData.short_description,
      full_description: formData.full_description,
      cover_image_url: formData.cover_image_url,
      video_url: formData.video_url,
      project_link: formData.project_link,
      featured: formData.featured,
      tools_used: formData.tools_used.split(",").map((t) => t.trim()).filter(Boolean),
      gallery_images: formData.gallery_images,
    };

    if (editingProject) {
      const { error } = await supabase.from("projects").update(projectData).eq("id", editingProject.id);
      if (error) toast.error(error.message);
      else { toast.success("Project updated!"); resetForm(); fetchProjects(); }
    } else {
      // Get next display order
      const maxOrder = projects.reduce((max, p) => Math.max(max, p.display_order || 0), 0);
      const { error } = await supabase.from("projects").insert({ ...projectData, display_order: maxOrder + 1 });
      if (error) toast.error(error.message);
      else { toast.success("Project created!"); resetForm(); fetchProjects(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted!"); fetchProjects(); }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      category: "vr",
      short_description: "",
      full_description: "",
      cover_image_url: "",
      video_url: "",
      tools_used: "",
      project_link: "",
      featured: false,
      gallery_images: [],
    });
    setEditingProject(null);
    setShowForm(false);
  };

  const startEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      slug: project.slug,
      category: project.category as "vr" | "ar" | "interactive" | "award",
      short_description: project.short_description || "",
      full_description: project.full_description || "",
      cover_image_url: project.cover_image_url || "",
      video_url: project.video_url || "",
      tools_used: project.tools_used?.join(", ") || "",
      project_link: project.project_link || "",
      featured: project.featured || false,
      gallery_images: project.gallery_images || [],
    });
    setShowForm(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex((p) => p.id === active.id);
      const newIndex = projects.findIndex((p) => p.id === over.id);
      
      const newProjects = arrayMove(projects, oldIndex, newIndex);
      setProjects(newProjects);

      // Update display_order for all projects
      const updates = newProjects.map((project, index) => ({
        id: project.id,
        display_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from("projects")
          .update({ display_order: update.display_order })
          .eq("id", update.id);
      }

      toast.success("Project order updated!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl font-bold">Projects</h2>
        <Button onClick={() => setShowForm(true)} className="glow-primary">
          <Plus className="w-4 h-4 mr-2" /> Add Project
        </Button>
      </div>

      {showForm && (
        <div className="glass-card p-6">
          <h3 className="font-display text-lg font-bold mb-4">
            {editingProject ? "Edit Project" : "New Project"}
          </h3>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <Input
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="bg-background/50"
            />
            <Input
              placeholder="Slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              className="bg-background/50"
            />
            <Select
              value={formData.category}
              onValueChange={(v: "vr" | "ar" | "interactive" | "award") => setFormData({ ...formData, category: v })}
            >
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vr">VR</SelectItem>
                <SelectItem value="ar">AR</SelectItem>
                <SelectItem value="interactive">Interactive</SelectItem>
                <SelectItem value="award">Award</SelectItem>
              </SelectContent>
            </Select>
            <ImageUpload
              value={formData.cover_image_url}
              onChange={(url) => setFormData({ ...formData, cover_image_url: url })}
            />
            <Input
              placeholder="Video URL"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              className="bg-background/50"
            />
            <Input
              placeholder="Project Link"
              value={formData.project_link}
              onChange={(e) => setFormData({ ...formData, project_link: e.target.value })}
              className="bg-background/50"
            />
            <Input
              placeholder="Tools (comma-separated)"
              value={formData.tools_used}
              onChange={(e) => setFormData({ ...formData, tools_used: e.target.value })}
              className="bg-background/50 md:col-span-2"
            />
            <Textarea
              placeholder="Short Description"
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              className="bg-background/50 md:col-span-2"
            />
            <Textarea
              placeholder="Full Description"
              value={formData.full_description}
              onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
              className="bg-background/50 md:col-span-2"
              rows={4}
            />
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Gallery Images</label>
              <GalleryUpload
                images={formData.gallery_images}
                onChange={(urls) => setFormData({ ...formData, gallery_images: urls })}
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit">{editingProject ? "Update" : "Create"}</Button>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Drag and drop projects to reorder them on the main page
        </p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={projects.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid gap-3">
              {projects.map((project) => (
                <SortableItem key={project.id} id={project.id}>
                  <div className="flex items-center justify-between flex-1 ml-2">
                    <div className="flex items-center gap-4">
                      {project.cover_image_url && (
                        <img src={project.cover_image_url} alt="" className="w-16 h-16 object-cover rounded" />
                      )}
                      <div>
                        <h3 className="font-bold">{project.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {project.category} • {project.short_description?.slice(0, 50)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(project)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(project.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </SortableItem>
              ))}
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
