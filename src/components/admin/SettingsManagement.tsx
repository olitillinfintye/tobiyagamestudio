import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, RefreshCw } from "lucide-react";

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

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .in("key", ["hero_projects", "hero_team_members", "hero_awards", "hero_years"]);

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
  );
}
