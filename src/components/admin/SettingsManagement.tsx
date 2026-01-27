import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, RefreshCw, Upload, Box } from "lucide-react";

interface HeroStat {
  key: string;
  value: string;
  label: string;
}

export function SettingsManagement() {
  const [stats, setStats] = useState<HeroStat[]>([
    { key: "hero_projects", value: "", label: "Projects" },
    { key: "hero_team_members", value: "", label: "Team Members" },
    { key: "hero_awards", value: "", label: "Awards" },
    { key: "hero_years", value: "", label: "Years" },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modelUrl, setModelUrl] = useState("/models/vr_headset.glb");
  const [uploadingModel, setUploadingModel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .in("key", ["hero_projects", "hero_team_members", "hero_awards", "hero_years", "hero_3d_model"]);

    if (error) {
      toast.error("Failed to load settings");
      console.error(error);
    } else if (data) {
      setStats((prev) =>
        prev.map((stat) => {
          const found = data.find((d: any) => d.key === stat.key);
          return found ? { ...stat, value: found.value, label: found.label || stat.label } : stat;
        })
      );
      const modelSetting = data.find((d: any) => d.key === "hero_3d_model");
      if (modelSetting) {
        setModelUrl(modelSetting.value);
      }
    }
    setLoading(false);
  };

  const handleChange = (key: string, field: "value" | "label", newValue: string) => {
    setStats((prev) =>
      prev.map((stat) => (stat.key === key ? { ...stat, [field]: newValue } : stat))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const stat of stats) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value: stat.value, label: stat.label })
          .eq("key", stat.key);

        if (error) throw error;
      }
      toast.success("Hero stats updated successfully!");
    } catch (error: any) {
      toast.error("Failed to save settings: " + error.message);
    }
    setSaving(false);
  };

  const handleModelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
      toast.error("Please upload a GLB or GLTF file");
      return;
    }

    setUploadingModel(true);
    try {
      const fileName = `3d-models/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("project-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("project-images")
        .getPublicUrl(fileName);

      const newModelUrl = urlData.publicUrl;

      // Update the database setting
      const { error: updateError } = await supabase
        .from("site_settings")
        .upsert({ 
          key: "hero_3d_model", 
          value: newModelUrl, 
          label: "Hero 3D Model",
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (updateError) throw updateError;

      setModelUrl(newModelUrl);
      toast.success("3D model uploaded successfully! Refresh the page to see changes.");
    } catch (error: any) {
      toast.error("Failed to upload model: " + error.message);
    }
    setUploadingModel(false);
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
    <div className="space-y-6">
      {/* Hero Stats Section */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Hero Section Stats</h2>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <p className="text-muted-foreground text-sm mb-6">
          These stats are displayed in the hero section of the homepage.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {stats.map((stat) => (
            <div key={stat.key} className="space-y-3 p-4 rounded-lg bg-background/50 border border-border/50">
              <div className="space-y-2">
                <Label htmlFor={`${stat.key}-value`}>Value</Label>
                <Input
                  id={`${stat.key}-value`}
                  value={stat.value}
                  onChange={(e) => handleChange(stat.key, "value", e.target.value)}
                  placeholder="e.g., 15+"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${stat.key}-label`}>Label</Label>
                <Input
                  id={`${stat.key}-label`}
                  value={stat.label}
                  onChange={(e) => handleChange(stat.key, "label", e.target.value)}
                  placeholder="e.g., Projects"
                  className="bg-background/50"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3D Model Section */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Box className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">Hero 3D Model</h2>
        </div>

        <p className="text-muted-foreground text-sm mb-6">
          Upload a new GLB/GLTF 3D model to display in the hero section. The model should be optimized for web (under 5MB recommended).
        </p>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-background/50 border border-border/50">
            <Label className="text-sm text-muted-foreground mb-2 block">Current Model</Label>
            <p className="text-sm font-mono break-all">{modelUrl}</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf"
            onChange={handleModelUpload}
            className="hidden"
          />

          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingModel}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {uploadingModel ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload New 3D Model
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
