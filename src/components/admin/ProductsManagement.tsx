import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { cms } from "@/integrations/cpanel/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Eye, EyeOff, ExternalLink, Star } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { GalleryUpload } from "./GalleryUpload";
import { SortableItem } from "./SortableItem";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { PRODUCT_PLATFORMS, STORES, slugify, storeLabel, type Product, type StoreLink } from "@/lib/products";
import { cn } from "@/lib/utils";

type Filter = "all" | "published" | "draft";

type FormState = {
  title: string;
  slug: string;
  tagline: string;
  description: string;
  cover_image_url: string;
  trailer_url: string;
  platforms: string[];
  store_links: StoreLink[];
  gallery_images: string[];
  featured: boolean;
};

const emptyForm: FormState = {
  title: "",
  slug: "",
  tagline: "",
  description: "",
  cover_image_url: "",
  trailer_url: "",
  platforms: [],
  store_links: [],
  gallery_images: [],
  featured: false,
};

export function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [customPlatform, setCustomPlatform] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await cms.from("products").select("*").order("display_order");
    if (error) toast.error(error.message);
    else if (data) setProducts(data);
  };

  const visible = useMemo(
    () => (filter === "all" ? products : products.filter((p) => p.status === filter)),
    [products, filter],
  );
  const counts = useMemo(
    () => ({
      all: products.length,
      published: products.filter((p) => p.status === "published").length,
      draft: products.filter((p) => p.status === "draft").length,
    }),
    [products],
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(false);
    setSlugTouched(false);
    setCustomPlatform("");
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const startEdit = (product: Product) => {
    setEditing(product);
    setSlugTouched(true);
    setForm({
      title: product.title,
      slug: product.slug,
      tagline: product.tagline ?? "",
      description: product.description ?? "",
      cover_image_url: product.cover_image_url ?? "",
      trailer_url: product.trailer_url ?? "",
      platforms: product.platforms ?? [],
      store_links: product.store_links ?? [],
      gallery_images: product.gallery_images ?? [],
      featured: product.featured ?? false,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async (status: "draft" | "published") => {
    if (!form.title.trim() || !form.slug) {
      toast.error("Title and slug are required.");
      return;
    }
    setSaving(true);
    const wasPublished = editing?.status === "published";
    const payload = {
      title: form.title.trim(),
      slug: form.slug,
      tagline: form.tagline.trim() || null,
      description: form.description || null,
      cover_image_url: form.cover_image_url || null,
      trailer_url: form.trailer_url.trim() || null,
      platforms: form.platforms,
      store_links: form.store_links.filter((l) => l.url.trim()).map((l) => ({ platform: l.platform, url: l.url.trim() })),
      gallery_images: form.gallery_images,
      featured: form.featured,
      status,
      published_at: status === "published" ? (wasPublished ? editing?.published_at ?? new Date().toISOString() : new Date().toISOString()) : editing?.published_at ?? null,
    };

    const { error } = editing
      ? await cms.from("products").update(payload).eq("id", editing.id)
      : await cms.from("products").insert({
          ...payload,
          display_order: products.reduce((max, p) => Math.max(max, p.display_order ?? 0), 0) + 1,
        });
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "published" ? "Product published!" : "Draft saved.");
    resetForm();
    fetchProducts();
  };

  const toggleStatus = async (product: Product) => {
    const status = product.status === "published" ? "draft" : "published";
    const { error } = await cms
      .from("products")
      .update({ status, ...(status === "published" ? { published_at: new Date().toISOString() } : {}) })
      .eq("id", product.id);
    if (error) toast.error(error.message);
    else {
      toast.success(status === "published" ? "Published." : "Moved to drafts.");
      fetchProducts();
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.title}"? This cannot be undone.`)) return;
    const { error } = await cms.from("products").delete().eq("id", product.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted.");
      fetchProducts();
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const reordered = arrayMove(
      products,
      products.findIndex((p) => p.id === active.id),
      products.findIndex((p) => p.id === over.id),
    );
    setProducts(reordered);
    for (const [index, product] of reordered.entries()) {
      await cms.from("products").update({ display_order: index }).eq("id", product.id);
    }
    toast.success("Product order updated!");
  };

  const togglePlatform = (platform: string) =>
    set("platforms", form.platforms.includes(platform) ? form.platforms.filter((p) => p !== platform) : [...form.platforms, platform]);

  const addCustomPlatform = () => {
    const value = customPlatform.trim();
    if (value && !form.platforms.includes(value)) set("platforms", [...form.platforms, value]);
    setCustomPlatform("");
  };

  const updateLink = (index: number, patch: Partial<StoreLink>) =>
    set("store_links", form.store_links.map((l, i) => (i === index ? { ...l, ...patch } : l)));

  const extraPlatforms = form.platforms.filter((p) => !PRODUCT_PLATFORMS.includes(p));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Products</h2>
          <p className="text-sm text-muted-foreground">Games and apps shown on the public Products page.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/products" target="_blank">
              <ExternalLink className="w-4 h-4 mr-2" /> View page
            </Link>
          </Button>
          <Button onClick={startCreate} className="glow-primary">
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h3 className="font-display text-lg font-bold">{editing ? `Edit: ${editing.title}` : "New Product"}</h3>
            {editing && (
              <Badge variant={editing.status === "published" ? "default" : "secondary"}>
                {editing.status === "published" ? "Published" : "Draft"}
              </Badge>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save("published");
            }}
            className="grid md:grid-cols-2 gap-4"
          >
            <div className="space-y-2">
              <Label htmlFor="product-title">Title</Label>
              <Input
                id="product-title"
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
                }}
                required
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-slug">URL slug</Label>
              <Input
                id="product-slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", slugify(e.target.value));
                }}
                required
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground">/products/{form.slug || "your-product"}</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="product-tagline">Tagline</Label>
              <Input
                id="product-tagline"
                placeholder="One line that sells it"
                value={form.tagline}
                onChange={(e) => set("tagline", e.target.value)}
                maxLength={160}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Cover image</Label>
              <ImageUpload value={form.cover_image_url} onChange={(url) => set("cover_image_url", url)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-trailer">Trailer URL (YouTube, Vimeo or video file)</Label>
              <Input
                id="product-trailer"
                placeholder="https://youtube.com/watch?v=…"
                value={form.trailer_url}
                onChange={(e) => set("trailer_url", e.target.value)}
                className="bg-background/50"
              />
              <div className="flex items-center gap-3 pt-4">
                <Switch id="product-featured" checked={form.featured} onCheckedChange={(v) => set("featured", v)} />
                <Label htmlFor="product-featured">Featured (shown large at the top)</Label>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Platforms</Label>
              <div className="flex flex-wrap gap-2">
                {[...PRODUCT_PLATFORMS, ...extraPlatforms].map((platform) => {
                  const active = form.platforms.includes(platform);
                  return (
                    <button
                      key={platform}
                      type="button"
                      aria-pressed={active}
                      onClick={() => togglePlatform(platform)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition-colors focus-ring",
                        active ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/60",
                      )}
                    >
                      {platform}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 max-w-sm">
                <Input
                  placeholder="Other platform"
                  value={customPlatform}
                  onChange={(e) => setCustomPlatform(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomPlatform();
                    }
                  }}
                  className="bg-background/50"
                />
                <Button type="button" variant="outline" onClick={addCustomPlatform}>
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Store links</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => set("store_links", [...form.store_links, { platform: "meta", url: "" }])}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add link
                </Button>
              </div>
              {form.store_links.length === 0 && <p className="text-sm text-muted-foreground">No store links yet.</p>}
              {form.store_links.map((link, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-2">
                  <Select value={link.platform} onValueChange={(v) => updateLink(index, { platform: v })}>
                    <SelectTrigger className="sm:w-52 bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STORES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="url"
                    placeholder="https://…"
                    value={link.url}
                    onChange={(e) => updateLink(index, { url: e.target.value })}
                    className="flex-1 bg-background/50"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove link"
                    onClick={() => set("store_links", form.store_links.filter((_, i) => i !== index))}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={8}
                placeholder="Features, story, what makes it special…"
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Gallery (screenshots)</Label>
              <GalleryUpload images={form.gallery_images} onChange={(urls) => set("gallery_images", urls)} />
            </div>

            <div className="md:col-span-2 flex flex-wrap gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                <Eye className="w-4 h-4 mr-2" />
                {editing?.status === "published" ? "Update & keep published" : "Publish"}
              </Button>
              <Button type="button" variant="secondary" disabled={saving} onClick={() => save("draft")}>
                <EyeOff className="w-4 h-4 mr-2" />
                {editing?.status === "published" ? "Unpublish & save as draft" : "Save draft"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter products">
        {(["all", "published", "draft"] as Filter[]).map((f) => (
          <Button
            key={f}
            size="sm"
            role="tab"
            aria-selected={filter === f}
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f === "published" ? "Published" : "Drafts"} ({counts[f]})
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {filter === "all" && products.length > 1 && (
          <p className="text-sm text-muted-foreground">Drag and drop to reorder products on the Products page.</p>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={visible.map((p) => p.id)} strategy={verticalListSortingStrategy} disabled={filter !== "all"}>
            <div className="grid gap-3">
              {visible.map((product) => (
                <SortableItem key={product.id} id={product.id}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between flex-1 ml-2 gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                      {product.cover_image_url ? (
                        <img src={product.cover_image_url} alt="" className="w-20 h-14 object-cover rounded shrink-0" />
                      ) : (
                        <div className="w-20 h-14 rounded bg-muted shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold truncate">{product.title}</h3>
                          <Badge variant={product.status === "published" ? "default" : "secondary"}>
                            {product.status === "published" ? "Published" : "Draft"}
                          </Badge>
                          {product.featured && <Star className="w-4 h-4 text-accent fill-accent" aria-label="Featured" />}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {[product.platforms?.join(", "), product.store_links?.map((l) => storeLabel(l.platform)).join(", ")]
                            .filter(Boolean)
                            .join(" • ") || product.tagline}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => toggleStatus(product)}>
                        {product.status === "published" ? "Unpublish" : "Publish"}
                      </Button>
                      {product.status === "published" && (
                        <Button size="sm" variant="outline" asChild aria-label="View on site">
                          <Link to={`/products/${product.slug}`} target="_blank">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => startEdit(product)} aria-label="Edit">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(product)} aria-label="Delete">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </SortableItem>
              ))}
              {visible.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  {products.length === 0 ? "No products yet. Add your first product!" : "Nothing here."}
                </p>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
