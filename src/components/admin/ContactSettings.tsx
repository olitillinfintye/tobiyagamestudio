import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, RefreshCw, Mail, Phone, MapPin, Globe } from "lucide-react";

interface ContactSetting {
  key: string;
  value: string;
  label: string;
  icon: React.ElementType;
}

export function ContactSettings() {
  const [settings, setSettings] = useState<ContactSetting[]>([
    { key: "contact_email", value: "", label: "Email", icon: Mail },
    { key: "contact_phone", value: "", label: "Phone", icon: Phone },
    { key: "contact_location", value: "", label: "Location", icon: MapPin },
    { key: "contact_website", value: "", label: "Website", icon: Globe },
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
      .in("key", ["contact_email", "contact_phone", "contact_location", "contact_website"]);

    if (error) {
      toast.error("Failed to load contact settings");
      console.error(error);
    } else if (data) {
      setSettings((prev) =>
        prev.map((setting) => {
          const found = data.find((d: any) => d.key === setting.key);
          return found ? { ...setting, value: found.value, label: found.label || setting.label } : setting;
        })
      );
    }
    setLoading(false);
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) =>
      prev.map((setting) => (setting.key === key ? { ...setting, value } : setting))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const setting of settings) {
        const { error } = await supabase
          .from("site_settings")
          .upsert({ 
            key: setting.key, 
            value: setting.value, 
            label: setting.label,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });

        if (error) throw error;
      }
      toast.success("Contact information updated successfully!");
    } catch (error: any) {
      toast.error("Failed to save settings: " + error.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Contact Information</h2>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <p className="text-muted-foreground text-sm mb-6">
        Update the contact information displayed on the website's contact section.
      </p>

      <div className="grid gap-4">
        {settings.map((setting) => {
          const IconComponent = setting.icon;
          return (
            <div key={setting.key} className="flex items-center gap-4 p-4 rounded-lg bg-background/50 border border-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <IconComponent className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor={setting.key}>{setting.label}</Label>
                <Input
                  id={setting.key}
                  value={setting.value}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  placeholder={`Enter ${setting.label.toLowerCase()}`}
                  className="bg-background/50"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
