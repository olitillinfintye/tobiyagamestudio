import { useState } from "react";
import { cms } from "@/integrations/cpanel/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { slugify } from "@/lib/products";
import type { Project, ProjectCategory } from "@/lib/projects";

interface Props {
  categories: ProjectCategory[];
  projects: Project[];
  onChange: () => void;
}

/** Add, rename, reorder and delete the categories used to filter projects. */
export function ProjectCategoriesManager({ categories, projects, onChange }: Props) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const usage = (slug: string) => projects.filter((p) => p.category === slug).length;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = slugify(name);
    if (!slug) return;
    if (categories.some((c) => c.slug === slug)) {
      toast.error("That category already exists.");
      return;
    }
    const order = categories.reduce((max, c) => Math.max(max, c.display_order ?? 0), 0) + 1;
    const { error } = await cms.from("project_categories").insert({ name: name.trim(), slug, display_order: order });
    if (error) toast.error(error.message);
    else {
      toast.success(`Category "${name.trim()}" added.`);
      setName("");
      onChange();
    }
  };

  const rename = async (category: ProjectCategory) => {
    if (!editName.trim()) return;
    // The slug stays the same so existing projects keep their category.
    const { error } = await cms.from("project_categories").update({ name: editName.trim() }).eq("id", category.id);
    if (error) toast.error(error.message);
    else {
      setEditingId(null);
      onChange();
    }
  };

  const remove = async (category: ProjectCategory) => {
    const used = usage(category.slug);
    if (used > 0) {
      toast.error(`${used} project(s) use "${category.name}". Move them to another category first.`);
      return;
    }
    if (!confirm(`Delete category "${category.name}"?`)) return;
    const { error } = await cms.from("project_categories").delete().eq("id", category.id);
    if (error) toast.error(error.message);
    else onChange();
  };

  const move = async (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= categories.length) return;
    const reordered = [...categories];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    for (const [i, c] of reordered.entries()) {
      await cms.from("project_categories").update({ display_order: i }).eq("id", c.id);
    }
    onChange();
  };

  return (
    <div className="glass-card p-5 space-y-4">
      <div>
        <h3 className="font-display text-lg font-bold">Categories</h3>
        <p className="text-sm text-muted-foreground">Shown as filters on the All Projects page, in this order.</p>
      </div>

      <form onSubmit={add} className="flex gap-2 max-w-md">
        <Input placeholder="New category, e.g. Games" value={name} onChange={(e) => setName(e.target.value)} className="bg-background/50" maxLength={60} />
        <Button type="submit" disabled={!slugify(name)}>
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </form>

      <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
        {categories.map((category, index) => (
          <li key={category.id} className="flex items-center gap-2 px-3 py-2">
            {editingId === category.id ? (
              <>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), rename(category))}
                  className="h-9 max-w-xs bg-background/50"
                  autoFocus
                />
                <Button size="icon" variant="ghost" aria-label="Save" onClick={() => rename(category)}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" aria-label="Cancel" onClick={() => setEditingId(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <span className="font-medium">{category.name}</span>
                <span className="text-xs text-muted-foreground">
                  {category.slug} · {usage(category.slug)} project(s)
                </span>
                <span className="ml-auto flex gap-1">
                  <Button size="icon" variant="ghost" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="Move down" disabled={index === categories.length - 1} onClick={() => move(index, 1)}>
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Rename"
                    onClick={() => {
                      setEditingId(category.id);
                      setEditName(category.name);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="Delete" className="text-destructive hover:text-destructive" onClick={() => remove(category)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </span>
              </>
            )}
          </li>
        ))}
        {categories.length === 0 && <li className="px-3 py-4 text-sm text-muted-foreground">No categories yet.</li>}
      </ul>
    </div>
  );
}
