import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Trophy } from "lucide-react";
import { ImageUpload } from "./ImageUpload";

type Award = {
  id: string;
  title: string;
  description: string | null;
  year: number | null;
  image_url: string | null;
  display_order: number | null;
};

export function AwardsManagement() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [editingAward, setEditingAward] = useState<Award | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    year: new Date().getFullYear(),
    image_url: "",
    display_order: 0,
  });

  useEffect(() => {
    fetchAwards();
  }, []);

  const fetchAwards = async () => {
    const { data } = await supabase.from("awards").select("*").order("display_order");
    if (data) setAwards(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingAward) {
      const { error } = await supabase.from("awards").update(formData).eq("id", editingAward.id);
      if (error) toast.error(error.message);
      else { toast.success("Award updated!"); resetForm(); fetchAwards(); }
    } else {
      const { error } = await supabase.from("awards").insert(formData);
      if (error) toast.error(error.message);
      else { toast.success("Award added!"); resetForm(); fetchAwards(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this award?")) return;
    const { error } = await supabase.from("awards").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted!"); fetchAwards(); }
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", year: new Date().getFullYear(), image_url: "", display_order: 0 });
    setEditingAward(null);
    setShowForm(false);
  };

  const startEdit = (award: Award) => {
    setEditingAward(award);
    setFormData({
      title: award.title,
      description: award.description || "",
      year: award.year || new Date().getFullYear(),
      image_url: award.image_url || "",
      display_order: award.display_order || 0,
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl font-bold">Awards & Recognition</h2>
        <Button onClick={() => setShowForm(true)} className="glow-primary">
          <Plus className="w-4 h-4 mr-2" /> Add Award
        </Button>
      </div>

      {showForm && (
        <div className="glass-card p-6">
          <h3 className="font-display text-lg font-bold mb-4">
            {editingAward ? "Edit Award" : "New Award"}
          </h3>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <Input
              placeholder="Award Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="bg-background/50"
            />
            <Input
              placeholder="Year"
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
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
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
            />
            <Textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-background/50 md:col-span-2"
              rows={3}
            />
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit">{editingAward ? "Update" : "Create"}</Button>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {awards.map((award) => (
          <div key={award.id} className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {award.image_url ? (
                <img src={award.image_url} alt="" className="w-16 h-16 object-cover rounded" />
              ) : (
                <div className="w-16 h-16 bg-primary/20 rounded flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>
              )}
              <div>
                <h3 className="font-bold">{award.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {award.year} • {award.description?.slice(0, 50)}...
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => startEdit(award)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(award.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {awards.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No awards yet. Add your first!</p>
        )}
      </div>
    </div>
  );
}
