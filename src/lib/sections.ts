import { useEffect, useState } from "react";
import { cms } from "@/integrations/cpanel/client";

/** Home-page sections an admin can hide. Must match hideableSections() in backend/policy.php. */
export const HIDEABLE_SECTIONS = [
  { id: "about", label: "About", description: "About us, mission and vision" },
  { id: "objectives", label: "Our Objectives", description: "The four objective cards inside About" },
  { id: "partners", label: "Partners", description: "Scrolling partner logo belt" },
  { id: "services", label: "Services", description: "Capabilities cards" },
  { id: "works", label: "Works", description: "Selected works on the home page" },
  { id: "products", label: "Products", description: "Products menu link and page" },
  { id: "team", label: "Team", description: "Team members" },
  { id: "awards", label: "Awards", description: "Recognition panel" },
  { id: "blog", label: "Blog", description: "Latest news" },
  { id: "contact", label: "Contact", description: "Contact details and form" },
] as const;

export type SectionId = (typeof HIDEABLE_SECTIONS)[number]["id"];

/** Used until an admin saves a choice. */
export const DEFAULT_HIDDEN: SectionId[] = ["objectives"];

const KEY = "hidden_sections";
let cache: Promise<SectionId[]> | null = null;

const parse = (value: string | null | undefined): SectionId[] => {
  if (!value) return DEFAULT_HIDDEN;
  try {
    const list = JSON.parse(value);
    return Array.isArray(list) ? list.filter((s): s is SectionId => HIDEABLE_SECTIONS.some((h) => h.id === s)) : DEFAULT_HIDDEN;
  } catch {
    return DEFAULT_HIDDEN;
  }
};

export function loadHiddenSections(force = false): Promise<SectionId[]> {
  if (!cache || force) {
    cache = Promise.resolve(cms.from("site_settings").select("value").eq("key", KEY).maybeSingle()).then(
      ({ data, error }) => (error ? DEFAULT_HIDDEN : parse(data?.value)),
      () => DEFAULT_HIDDEN,
    );
  }
  return cache;
}

export async function saveHiddenSections(hidden: SectionId[]) {
  const result = await cms
    .from("site_settings")
    .upsert({ key: KEY, value: JSON.stringify(hidden), label: "Hidden home-page sections" }, { onConflict: "key" });
  if (!result.error) cache = Promise.resolve(hidden);
  return result;
}

/**
 * Which sections are hidden. `ready` is false until the setting has loaded, so
 * callers can avoid flashing a section that is about to disappear.
 */
export function useHiddenSections() {
  const [hidden, setHidden] = useState<SectionId[] | null>(null);
  useEffect(() => {
    let alive = true;
    loadHiddenSections().then((h) => alive && setHidden(h));
    return () => {
      alive = false;
    };
  }, []);
  const list = hidden ?? DEFAULT_HIDDEN;
  return { ready: hidden !== null, isHidden: (id: SectionId) => list.includes(id), hidden: list };
}
