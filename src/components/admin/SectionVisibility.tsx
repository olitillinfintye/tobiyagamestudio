import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LayoutList, Save } from "lucide-react";
import { HIDEABLE_SECTIONS, loadHiddenSections, saveHiddenSections, type SectionId } from "@/lib/sections";

/** Lets admins show or hide each home-page section. */
export function SectionVisibility() {
  const [hidden, setHidden] = useState<SectionId[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadHiddenSections(true).then((h) => {
      setHidden(h);
      setLoaded(true);
    });
  }, []);

  const toggle = (id: SectionId, visible: boolean) =>
    setHidden((h) => (visible ? h.filter((x) => x !== id) : [...h, id]));

  const save = async () => {
    setSaving(true);
    const { error } = await saveHiddenSections(hidden);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Section visibility saved.");
  };

  return (
    <div className="glass-card p-6">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <LayoutList className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Page Sections</h2>
        </div>
        <Button onClick={save} disabled={saving || !loaded}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Turn sections off to hide them from the home page. Their menu and footer links are hidden too. Content is kept, so you can show it again any time.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {HIDEABLE_SECTIONS.map((s) => {
          const visible = !hidden.includes(s.id);
          return (
            <li key={s.id} className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-3">
              <Label htmlFor={`section-${s.id}`} className="cursor-pointer">
                <span className="block font-medium">{s.label}</span>
                <span className="block text-xs font-normal text-muted-foreground">{s.description}</span>
              </Label>
              <Switch id={`section-${s.id}`} checked={visible} disabled={!loaded} onCheckedChange={(v) => toggle(s.id, v)} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
