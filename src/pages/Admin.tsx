import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Edit, LogOut, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

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
};

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
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
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) checkAdmin(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) checkAdmin(session.user.id);
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase.from("admin_users").select("*").eq("user_id", userId).maybeSingle();
    setIsAdmin(!!data);
    if (data) fetchProjects();
    setLoading(false);
  };

  const fetchProjects = async () => {
    const { data } = await supabase.from("projects").select("*").order("display_order");
    if (data) setProjects(data);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    else toast.success("Logged in!");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const projectData = {
      ...formData,
      tools_used: formData.tools_used.split(",").map((t) => t.trim()).filter(Boolean),
    };

    if (editingProject) {
      const { error } = await supabase.from("projects").update(projectData).eq("id", editingProject.id);
      if (error) toast.error(error.message);
      else { toast.success("Project updated!"); resetForm(); fetchProjects(); }
    } else {
      const { error } = await supabase.from("projects").insert(projectData);
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
    setFormData({ title: "", slug: "", category: "vr", short_description: "", full_description: "", cover_image_url: "", video_url: "", tools_used: "", project_link: "", featured: false });
    setEditingProject(null);
    setShowForm(false);
  };

  const startEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      slug: project.slug,
      category: project.category,
      short_description: project.short_description || "",
      full_description: project.full_description || "",
      cover_image_url: project.cover_image_url || "",
      video_url: project.video_url || "",
      tools_used: project.tools_used?.join(", ") || "",
      project_link: project.project_link || "",
      featured: project.featured || false,
    });
    setShowForm(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p>Loading...</p></div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="glass-card p-8 w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-primary mb-6 hover:underline"><ArrowLeft className="w-4 h-4" /> Back to site</Link>
          <h1 className="font-display text-2xl font-bold mb-6">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background/50" />
            <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-background/50" />
            <Button type="submit" className="w-full">Login</Button>
          </form>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="glass-card p-8 text-center">
          <h1 className="font-display text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have admin access.</p>
          <Button onClick={handleLogout} variant="outline">Logout</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-primary mb-2 hover:underline text-sm"><ArrowLeft className="w-4 h-4" /> Back to site</Link>
            <h1 className="font-display text-3xl font-bold">Content Manager</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowForm(true)} className="glow-primary"><Plus className="w-4 h-4 mr-2" /> Add Project</Button>
            <Button onClick={handleLogout} variant="outline"><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>

        {showForm && (
          <div className="glass-card p-6 mb-8">
            <h2 className="font-display text-xl font-bold mb-4">{editingProject ? "Edit Project" : "New Project"}</h2>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
              <Input placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="bg-background/50" />
              <Input placeholder="Slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required className="bg-background/50" />
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="vr">VR</SelectItem><SelectItem value="ar">AR</SelectItem><SelectItem value="interactive">Interactive</SelectItem><SelectItem value="award">Award</SelectItem></SelectContent>
              </Select>
              <Input placeholder="Cover Image URL" value={formData.cover_image_url} onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })} className="bg-background/50" />
              <Input placeholder="Video URL" value={formData.video_url} onChange={(e) => setFormData({ ...formData, video_url: e.target.value })} className="bg-background/50" />
              <Input placeholder="Project Link" value={formData.project_link} onChange={(e) => setFormData({ ...formData, project_link: e.target.value })} className="bg-background/50" />
              <Input placeholder="Tools (comma-separated)" value={formData.tools_used} onChange={(e) => setFormData({ ...formData, tools_used: e.target.value })} className="bg-background/50 md:col-span-2" />
              <Textarea placeholder="Short Description" value={formData.short_description} onChange={(e) => setFormData({ ...formData, short_description: e.target.value })} className="bg-background/50 md:col-span-2" />
              <Textarea placeholder="Full Description" value={formData.full_description} onChange={(e) => setFormData({ ...formData, full_description: e.target.value })} className="bg-background/50 md:col-span-2" rows={4} />
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit">{editingProject ? "Update" : "Create"}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </div>
        )}

        <div className="grid gap-4">
          {projects.map((project) => (
            <div key={project.id} className="glass-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {project.cover_image_url && <img src={project.cover_image_url} alt="" className="w-16 h-16 object-cover rounded" />}
                <div>
                  <h3 className="font-bold">{project.title}</h3>
                  <p className="text-sm text-muted-foreground">{project.category} • {project.short_description?.slice(0, 50)}...</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(project)}><Edit className="w-4 h-4" /></Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(project.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
          {projects.length === 0 && <p className="text-center text-muted-foreground py-8">No projects yet. Add your first project!</p>}
        </div>
      </div>
    </div>
  );
}
