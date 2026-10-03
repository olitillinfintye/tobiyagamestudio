import { useEffect, useState } from "react";
import { cms } from "@/integrations/cpanel/client";
import type { Database } from "@/integrations/cpanel/types";

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectCategory = Database["public"]["Tables"]["project_categories"]["Row"];

const FALLBACK: Pick<ProjectCategory, "slug" | "name">[] = [
  { slug: "vr", name: "VR" },
  { slug: "ar", name: "AR" },
  { slug: "interactive", name: "Interactive" },
  { slug: "award", name: "Awards" },
];

/** Admin-managed project categories, falling back to the original four if none exist yet. */
export function useProjectCategories() {
  const [categories, setCategories] = useState<Pick<ProjectCategory, "slug" | "name">[]>(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  const reload = async () => {
    const { data } = await cms.from("project_categories").select("*").order("display_order");
    if (data?.length) setCategories(data);
    setLoaded(true);
  };

  useEffect(() => {
    reload();
  }, []);

  return { categories, loaded, reload };
}

export const categoryName = (categories: Pick<ProjectCategory, "slug" | "name">[], slug: string) =>
  categories.find((c) => c.slug === slug)?.name ?? slug.replace(/-/g, " ");

export type Media = { type: "image" | "video"; src: string };

/** Ordered media for a project popup: videos first, then cover and gallery images. */
export const projectMedia = (project: Project): Media[] => {
  const videos = [project.video_url, ...(project.video_urls ?? [])].filter((v): v is string => !!v);
  const images = [project.cover_image_url, ...(project.gallery_images ?? [])].filter((v): v is string => !!v);
  return [
    ...videos.map((src) => ({ type: "video" as const, src })),
    ...Array.from(new Set(images)).map((src) => ({ type: "image" as const, src })),
  ];
};

/**
 * Tool lists arrive from the CMS inconsistently — sometimes as separate entries
 * ("Unity", "Meta XR SDK"), sometimes as one delimited string
 * ("Unity - MetaSDK - Convai"). Normalise both into individual tags.
 */
export const normaliseTools = (tools: string[] | null): string[] =>
  (tools ?? [])
    .flatMap((tool) => tool.split(/\s*[-–—|/]\s*/))
    .map((tool) => tool.trim())
    .filter(Boolean);
