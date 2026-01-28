import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

const SOCIAL_PLATFORMS = [
  { value: "linkedin", label: "LinkedIn", icon: "Linkedin" },
  { value: "twitter", label: "Twitter/X", icon: "Twitter" },
  { value: "facebook", label: "Facebook", icon: "Facebook" },
  { value: "instagram", label: "Instagram", icon: "Instagram" },
  { value: "youtube", label: "YouTube", icon: "Youtube" },
  { value: "github", label: "GitHub", icon: "Github" },
  { value: "dribbble", label: "Dribbble", icon: "Dribbble" },
  { value: "behance", label: "Behance", icon: "Palette" },
  { value: "telegram", label: "Telegram", icon: "Send" },
  { value: "whatsapp", label: "WhatsApp", icon: "MessageCircle" },
  { value: "tiktok", label: "TikTok", icon: "Music" },
  { value: "website", label: "Website", icon: "Globe" },
  { value: "email", label: "Email", icon: "Mail" },
  { value: "other", label: "Other", icon: "Link" },
];

interface SocialLinksEditorProps {
  value: SocialLink[];
  onChange: (links: SocialLink[]) => void;
}

export function SocialLinksEditor({ value, onChange }: SocialLinksEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addLink = () => {
    onChange([...value, { platform: "linkedin", url: "", icon: "Linkedin" }]);
  };

  const removeLink = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: keyof SocialLink, newValue: string) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: newValue };
    
    // Auto-update icon when platform changes
    if (field === "platform") {
      const platform = SOCIAL_PLATFORMS.find(p => p.value === newValue);
      if (platform) {
        updated[index].icon = platform.icon;
      }
    }
    
    onChange(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newLinks = [...value];
    const draggedItem = newLinks[draggedIndex];
    newLinks.splice(draggedIndex, 1);
    newLinks.splice(index, 0, draggedItem);
    onChange(newLinks);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Social Media Links</Label>
        <Button type="button" variant="outline" size="sm" onClick={addLink}>
          <Plus className="w-4 h-4 mr-1" /> Add Link
        </Button>
      </div>
      
      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No social links added yet.</p>
      ) : (
        <div className="space-y-2">
          {value.map((link, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border/50 ${
                draggedIndex === index ? "opacity-50" : ""
              }`}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
              
              <Select
                value={link.platform}
                onValueChange={(val) => updateLink(index, "platform", val)}
              >
                <SelectTrigger className="w-32 bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <SelectItem key={platform.value} value={platform.value}>
                      {platform.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                placeholder="https://..."
                value={link.url}
                onChange={(e) => updateLink(index, "url", e.target.value)}
                className="flex-1 bg-background/50"
              />
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeLink(index)}
                className="text-destructive hover:text-destructive shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
