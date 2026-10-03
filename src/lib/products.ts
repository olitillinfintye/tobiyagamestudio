import type { Database } from "@/integrations/cpanel/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type StoreLink = { platform: string; url: string };

export const PRODUCT_PLATFORMS = [
  "Meta Quest",
  "PC VR",
  "Apple Vision Pro",
  "Windows",
  "macOS",
  "Android",
  "iOS",
  "Web",
  "PlayStation",
  "Xbox",
  "Nintendo Switch",
];

export const STORES: { value: string; label: string }[] = [
  { value: "meta", label: "Meta Horizon Store" },
  { value: "steam", label: "Steam" },
  { value: "google-play", label: "Google Play" },
  { value: "app-store", label: "App Store" },
  { value: "itch", label: "itch.io" },
  { value: "epic", label: "Epic Games Store" },
  { value: "playstation", label: "PlayStation Store" },
  { value: "xbox", label: "Microsoft Store" },
  { value: "website", label: "Website" },
  { value: "other", label: "Other" },
];

export const storeLabel = (value: string) => STORES.find((s) => s.value === value)?.label ?? value;

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Convert a YouTube or Vimeo page URL into an embeddable player URL; other URLs are returned unchanged. */
export const getEmbedUrl = (url: string): { kind: "iframe" | "video"; src: string } => {
  const youtube =
    url.match(/[?&]v=([^&]+)/)?.[1] ??
    url.match(/youtu\.be\/([^?&]+)/)?.[1] ??
    url.match(/youtube\.com\/(?:embed|shorts)\/([^?&]+)/)?.[1];
  if (youtube && /youtu/.test(url)) return { kind: "iframe", src: `https://www.youtube.com/embed/${youtube}` };
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1];
  if (vimeo) return { kind: "iframe", src: `https://player.vimeo.com/video/${vimeo}` };
  return { kind: "video", src: url };
};
