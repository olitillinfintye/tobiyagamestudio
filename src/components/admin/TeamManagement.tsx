import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Edit } from "lucide-react";
import { ImageUpload } from "./ImageUpload";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
  display_order: number | null;
};

export function TeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    bio: "",
    photo_url: "",
    display_order: 0,
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data } = await supabase.from("team_members").select("*").order("display_order");
    if (data) setMembers(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMember) {
      const { error } = await supabase.from("team_members").update(formData).eq("id", editingMember.id);
      if (error) toast.error(error.message);
      else { toast.success("Team member updated!"); resetForm(); fetchMembers(); }
    } else {
      const { error } = await supabase.from("team_members").insert(formData);
      if (error) toast.error(error.message);
      else { toast.success("Team member added!"); resetForm(); fetchMembers(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this team member?")) return;
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted!"); fetchMembers(); }
  };

  const resetForm = () => {
    setFormData({ name: "", role: "", bio: "", photo_url: "", display_order: 0 });
    setEditingMember(null);
    setShowForm(false);
  };

  const startEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      role: member.role,
      bio: member.bio || "",
      photo_url: member.photo_url || "",
      display_order: member.display_order || 0,
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl font-bold">Team Members</h2>
        <Button onClick={() => setShowForm(true)} className="glow-primary">
          <Plus className="w-4 h-4 mr-2" /> Add Member
        </Button>
      </div>

      {showForm && (
        <div className="glass-card p-6">
          <h3 className="font-display text-lg font-bold mb-4">
            {editingMember ? "Edit Team Member" : "New Team Member"}
          </h3>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <Input
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-background/50"
            />
            <Input
              placeholder="Role/Position"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
              className="bg-background/50"
            />
            <Input
              placeholder="Display Order"
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              className="bg-background/50"
            />
            <ImageUpload
              value={formData.photo_url}
              onChange={(url) => setFormData({ ...formData, photo_url: url })}
            />
            <Textarea
              placeholder="Bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="bg-background/50 md:col-span-2"
              rows={3}
            />
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit">{editingMember ? "Update" : "Create"}</Button>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {members.map((member) => (
          <div key={member.id} className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {member.photo_url && (
                <img src={member.photo_url} alt="" className="w-16 h-16 object-cover rounded-full" />
              )}
              <div>
                <h3 className="font-bold">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => startEdit(member)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(member.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No team members yet. Add your first!</p>
        )}
      </div>
    </div>
  );
}
