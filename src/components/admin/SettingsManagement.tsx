import { useState, useEffect, useRef, Suspense, lazy } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, RefreshCw, Upload, Box, Eye, Video, Link, Share2 } from "lucide-react";
import { ContactSettings } from "./ContactSettings";
import { SocialLinksEditor, SocialLink } from "./SocialLinksEditor";

// Lazy load the 3D preview component
const Model3DPreview = lazy(() => import("@/components/Model3DPreview"));

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
  const [showPreview, setShowPreview] = useState(false);
  const [showreelUrl, setShowreelUrl] = useState("");
  const [savingShowreel, setSavingShowreel] = useState(false);
  const [uploadingShowreel, setUploadingShowreel] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [savingSocialLinks, setSavingSocialLinks] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showreelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .in("key", ["hero_projects", "hero_team_members", "hero_awards", "hero_years", "hero_3d_model", "showreel_video_url", "social_links"]);

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
      const showreelSetting = data.find((d: any) => d.key === "showreel_video_url");
      if (showreelSetting) {
        setShowreelUrl(showreelSetting.value);
      }
      const socialLinksSetting = data.find((d: any) => d.key === "social_links");
      if (socialLinksSetting) {
        try {
          setSocialLinks(JSON.parse(socialLinksSetting.value));
        } catch {
          setSocialLinks([]);
        }
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
      setShowPreview(true);
      toast.success("3D model uploaded successfully! Preview updated.");
    } catch (error: any) {
      toast.error("Failed to upload model: " + error.message);
    }
    setUploadingModel(false);
  };

  const handleShowreelUrlSave = async () => {
    setSavingShowreel(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ 
          key: "showreel_video_url", 
          value: showreelUrl, 
          label: "Showreel Video URL",
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (error) throw error;
      toast.success("Showreel video URL saved successfully!");
    } catch (error: any) {
      toast.error("Failed to save showreel URL: " + error.message);
    }
    setSavingShowreel(false);
  };

  const handleShowreelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error("Please upload a video file");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error("Video file is too large. Max size is 100MB");
      return;
    }

    setUploadingShowreel(true);
    try {
      const fileName = `showreel/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("project-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("project-images")
        .getPublicUrl(fileName);

      const newVideoUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("site_settings")
        .upsert({ 
          key: "showreel_video_url", 
          value: newVideoUrl, 
          label: "Showreel Video URL",
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (updateError) throw updateError;

      setShowreelUrl(newVideoUrl);
      toast.success("Showreel video uploaded successfully!");
    } catch (error: any) {
      toast.error("Failed to upload video: " + error.message);
    }
    setUploadingShowreel(false);
  };

  const handleSaveSocialLinks = async () => {
    setSavingSocialLinks(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ 
          key: "social_links", 
          value: JSON.stringify(socialLinks), 
          label: "Social Media Links",
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (error) throw error;
      toast.success("Social media links saved successfully!");
    } catch (error: any) {
      toast.error("Failed to save social links: " + error.message);
    }
    setSavingSocialLinks(false);
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
      {/* Contact Information Section */}
      <ContactSettings />

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

          {/* 3D Model Preview */}
          {showPreview && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Model Preview</Label>
              <Suspense fallback={
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                </div>
              }>
                <Model3DPreview modelUrl={modelUrl} className="h-64 w-full" />
              </Suspense>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf"
            onChange={handleModelUpload}
            className="hidden"
          />

          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingModel}
              variant="outline"
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

            <Button
              variant="secondary"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? "Hide Preview" : "Show Preview"}
            </Button>
          </div>
        </div>
      </div>

      {/* Showreel Video Section */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Video className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">Showreel Video</h2>
        </div>

        <p className="text-muted-foreground text-sm mb-6">
          Add a video URL (YouTube, Vimeo, or direct link) or upload a video file for the hero section's "Watch Showreel" button.
        </p>

        <div className="space-y-4">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="showreel-url" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              Video URL (YouTube, Vimeo, or direct link)
            </Label>
            <div className="flex gap-2">
              <Input
                id="showreel-url"
                value={showreelUrl}
                onChange={(e) => setShowreelUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                className="bg-background/50 flex-1"
              />
              <Button onClick={handleShowreelUrlSave} disabled={savingShowreel}>
                {savingShowreel ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Video Preview */}
          {showreelUrl && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Preview</Label>
              <div className="aspect-video rounded-lg overflow-hidden bg-muted/20 border border-border/50">
                {showreelUrl.includes('youtube.com') || showreelUrl.includes('youtu.be') ? (
                  <iframe
                    src={showreelUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title="Showreel Preview"
                  />
                ) : showreelUrl.includes('vimeo.com') ? (
                  <iframe
                    src={showreelUrl.replace('vimeo.com/', 'player.vimeo.com/video/').split('?')[0]}
                    className="w-full h-full"
                    allowFullScreen
                    allow="autoplay; fullscreen; picture-in-picture"
                    title="Showreel Preview"
                  />
                ) : (
                  <video
                    src={showreelUrl}
                    className="w-full h-full"
                    controls
                    title="Showreel Preview"
                  />
                )}
              </div>
            </div>
          )}

          {/* Upload Alternative */}
          <div className="pt-4 border-t border-border/50">
            <Label className="text-sm text-muted-foreground mb-2 block">Or upload a video file (max 100MB)</Label>
            <input
              ref={showreelInputRef}
              type="file"
              accept="video/*"
              onChange={handleShowreelUpload}
              className="hidden"
            />
            <Button 
              onClick={() => showreelInputRef.current?.click()}
              disabled={uploadingShowreel}
              variant="outline"
            >
              {uploadingShowreel ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Video File
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Social Media Links Section */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Share2 className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">Social Media Links</h2>
          </div>
          <Button onClick={handleSaveSocialLinks} disabled={savingSocialLinks}>
            {savingSocialLinks ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Links
              </>
            )}
          </Button>
        </div>

        <p className="text-muted-foreground text-sm mb-6">
          Add social media links that will be displayed in the footer of the website.
        </p>

        <SocialLinksEditor value={socialLinks} onChange={setSocialLinks} />
      </div>
    </div>
  );
}
