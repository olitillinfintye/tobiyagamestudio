import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "./ImageUpload";
import { RichTextEditor } from "./RichTextEditor";
import { 
  FileText, 
  Settings, 
  Image, 
  Tags, 
  Save, 
  Eye, 
  ArrowLeft,
  Clock,
  User,
  Globe,
  Hash,
  Plus,
  X
} from "lucide-react";

export const BLOG_CATEGORIES = [
  "General",
  "News",
  "Tutorials",
  "Case Studies",
  "Industry Insights",
  "Product Updates",
  "Announcements",
  "Behind the Scenes",
];

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  author_name: string;
  published: boolean;
  published_at: string;
  category: string;
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
}

interface BlogPostEditorProps {
  initialData?: BlogFormData;
  onSave: (data: BlogFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
  isSaving?: boolean;
}

export function BlogPostEditor({ 
  initialData, 
  onSave, 
  onCancel, 
  isEditing = false,
  isSaving = false 
}: BlogPostEditorProps) {
  const [formData, setFormData] = useState<BlogFormData>(
    initialData || {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      cover_image_url: "",
      author_name: "Tobiya Studio",
      published: false,
      published_at: "",
      category: "General",
      tags: [],
      meta_title: "",
      meta_description: "",
    }
  );
  const [newTag, setNewTag] = useState("");
  const [activeTab, setActiveTab] = useState("content");

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
      meta_title: formData.meta_title || title,
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()],
      });
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const wordCount = formData.content.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h2 className="text-xl font-bold">
            {isEditing ? "Edit Post" : "Create New Post"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4">
            <Switch
              id="published"
              checked={formData.published}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, published: checked })
              }
            />
            <Label htmlFor="published" className="text-sm">
              {formData.published ? "Published" : "Draft"}
            </Label>
          </div>
          <Button type="submit" disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">
              Post Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter an engaging title..."
              className="text-lg h-12"
              required
            />
          </div>

          {/* Content Editor Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content" className="gap-2">
                <FileText className="w-4 h-4" />
                Content
              </TabsTrigger>
              <TabsTrigger value="excerpt" className="gap-2">
                <Tags className="w-4 h-4" />
                Excerpt
              </TabsTrigger>
              <TabsTrigger value="seo" className="gap-2">
                <Globe className="w-4 h-4" />
                SEO
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Content *</Label>
                  <div className="text-xs text-muted-foreground flex items-center gap-4">
                    <span>{wordCount} words</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {readTime} min read
                    </span>
                  </div>
                </div>
                <RichTextEditor
                  value={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  placeholder="Write your blog post content here..."
                />
              </div>
            </TabsContent>

            <TabsContent value="excerpt" className="mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Excerpt</Label>
                  <p className="text-sm text-muted-foreground">
                    A brief summary that appears in blog listings and search results.
                  </p>
                  <Textarea
                    value={formData.excerpt}
                    onChange={(e) =>
                      setFormData({ ...formData, excerpt: e.target.value })
                    }
                    placeholder="Write a compelling summary of your post (recommended: 150-200 characters)..."
                    rows={4}
                    maxLength={300}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.excerpt.length}/300 characters
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    value={formData.meta_title || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, meta_title: e.target.value })
                    }
                    placeholder="SEO title (recommended: 50-60 characters)"
                    maxLength={70}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {(formData.meta_title || "").length}/70 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    value={formData.meta_description || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, meta_description: e.target.value })
                    }
                    placeholder="SEO description (recommended: 150-160 characters)"
                    rows={3}
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {(formData.meta_description || "").length}/200 characters
                  </p>
                </div>

                {/* SEO Preview */}
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-2">Search Preview</p>
                    <p className="text-primary text-lg truncate">
                      {formData.meta_title || formData.title || "Post Title"}
                    </p>
                    <p className="text-sm text-green-500 truncate">
                      tobiyastudio.com/blog/{formData.slug || "post-slug"}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {formData.meta_description || formData.excerpt || "Post description will appear here..."}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Settings Sidebar */}
        <div className="space-y-6">
          {/* Cover Image */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                <Label className="font-semibold">Cover Image</Label>
              </div>
              <ImageUpload
                value={formData.cover_image_url}
                onChange={(url) =>
                  setFormData({ ...formData, cover_image_url: url })
                }
              />
            </CardContent>
          </Card>

          {/* Post Settings */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <Label className="font-semibold">Post Settings</Label>
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-sm flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  URL Slug
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="post-url-slug"
                  required
                />
              </div>

              {/* Author */}
              <div className="space-y-2">
                <Label htmlFor="author" className="text-sm flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Author
                </Label>
                <Input
                  id="author"
                  value={formData.author_name}
                  onChange={(e) =>
                    setFormData({ ...formData, author_name: e.target.value })
                  }
                  placeholder="Author name"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label className="text-sm">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOG_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Publish Date */}
              <div className="space-y-2">
                <Label htmlFor="published_at" className="text-sm flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Publish Date
                </Label>
                <Input
                  id="published_at"
                  type="date"
                  value={formData.published_at}
                  onChange={(e) =>
                    setFormData({ ...formData, published_at: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Tags className="w-4 h-4" />
                <Label className="font-semibold">Tags</Label>
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
                <Button type="button" size="sm" onClick={addTag}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
