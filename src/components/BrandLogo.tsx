import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
// Trimmed variants: the source assets are 1920x1920 squares with ~69% vertical
// transparent padding, which forced the old 112px height inside an 80px navbar.
// These are the same marks with the dead space cropped (content aspect ~2.74:1).
import tobiyaLogoWhite from "@/assets/tobiya-logo-white-trimmed.png";
import tobiyaLogoDark from "@/assets/tobiya-logo-trimmed.png";

interface BrandLogoProps {
  className?: string;
}

/**
 * Theme-aware brand mark.
 *
 * Uses `resolvedTheme` rather than `theme` so it stays correct when the provider
 * is set to follow the system preference (where `theme` is the string "system").
 * Renders the white mark until mounted to avoid a hydration/flash mismatch.
 */
export function BrandLogo({ className }: BrandLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const src = mounted && resolvedTheme === "light" ? tobiyaLogoDark : tobiyaLogoWhite;

  return (
    <img
      src={src}
      alt="Tobiya Game Studio"
      width={1725}
      height={675}
      className={cn("w-auto object-contain", className)}
    />
  );
}
