import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, RefreshCw, Save, X, Pencil } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { SortableItem } from "./SortableItem";

interface Partner {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  display_order: number;
  is_active: boolean;
}

export function PartnersManagement() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
    website_url: "",
    is_active: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast.error("Failed to load partners");
    } else {
      setPartners(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      logo_url: "",
      website_url: "",
      is_active: true,
    });
    setEditingPartner(null);
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      logo_url: partner.logo_url,
      website_url: partner.website_url || "",
      is_active: partner.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.logo_url) {
      toast.error("Name and logo are required");
      return;
    }

    try {
      if (editingPartner) {
        const { error } = await supabase
          .from("partners")
          .update({
            name: formData.name,
            logo_url: formData.logo_url,
            website_url: formData.website_url || null,
            is_active: formData.is_active,
          })
          .eq("id", editingPartner.id);

        if (error) throw error;
        toast.success("Partner updated!");
      } else {
        const maxOrder = partners.length > 0 
          ? Math.max(...partners.map(p => p.display_order)) + 1 
          : 0;

        const { error } = await supabase.from("partners").insert({
          name: formData.name,
          logo_url: formData.logo_url,
          website_url: formData.website_url || null,
          is_active: formData.is_active,
          display_order: maxOrder,
        });

        if (error) throw error;
        toast.success("Partner added!");
      }

      setDialogOpen(false);
      resetForm();
      fetchPartners();
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this partner?")) return;

    const { error } = await supabase.from("partners").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Partner deleted");
      fetchPartners();
    }
  };

  const toggleActive = async (partner: Partner) => {
    const { error } = await supabase
      .from("partners")
      .update({ is_active: !partner.is_active })
      .eq("id", partner.id);

    if (error) {
      toast.error("Failed to update");
    } else {
      fetchPartners();
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = partners.findIndex((p) => p.id === active.id);
      const newIndex = partners.findIndex((p) => p.id === over.id);

      const newPartners = arrayMove(partners, oldIndex, newIndex);
      setPartners(newPartners);

      // Update display orders in database
      const updates = newPartners.map((p, i) => ({
        id: p.id,
        display_order: i,
      }));

      for (const update of updates) {
        await supabase
          .from("partners")
          .update({ display_order: update.display_order })
          .eq("id", update.id);
      }

      toast.success("Order updated");
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Partners & Logos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Drag to reorder partner logos in the marquee
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Partner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPartner ? "Edit Partner" : "Add New Partner"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Partner Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Company Name"
                />
              </div>

              <div className="space-y-2">
                <Label>Logo *</Label>
                <ImageUpload
                  value={formData.logo_url}
                  onChange={(url) => setFormData({ ...formData, logo_url: url })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website URL (optional)</Label>
                <Input
                  id="website"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="active">Active</Label>
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {editingPartner ? "Update" : "Add"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {partners.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No partners added yet.</p>
          <p className="text-sm mt-1">Click "Add Partner" to get started.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={partners.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {partners.map((partner) => (
                <SortableItem
                  key={partner.id}
                  id={partner.id}
                  className={`p-4 rounded-lg border ${
                    partner.is_active ? "bg-background/50 border-border/50" : "bg-muted/30 border-border/30 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-12 bg-muted/20 rounded flex items-center justify-center overflow-hidden">
                      <img
                        src={partner.logo_url}
                        alt={partner.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{partner.name}</h4>
                      {partner.website_url && (
                        <a
                          href={partner.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                          {partner.website_url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={partner.is_active}
                        onCheckedChange={() => toggleActive(partner)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(partner)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(partner.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
