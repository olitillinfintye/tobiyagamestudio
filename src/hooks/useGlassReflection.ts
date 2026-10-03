import { useEffect, useRef } from "react";

export function useGlassReflection() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;

    const preference = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let surface: HTMLElement | null = null;
    let frame: number | null = null;
    let pointerX = 0;
    let pointerY = 0;

    const clearSurface = () => {
      surface?.style.removeProperty("--glass-x");
      surface?.style.removeProperty("--glass-y");
      surface?.removeAttribute("data-glass-active");
      surface = null;
    };

    const reset = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      clearSurface();
    };

    const move = (event: PointerEvent) => {
      if (!preference.matches || event.pointerType === "touch") return;
      const nextSurface = event.target instanceof Element
        ? event.target.closest<HTMLElement>(".glass-card, .studio-glass")
        : null;

      if (!nextSurface || !element.contains(nextSurface)) {
        reset();
        return;
      }

      if (surface !== nextSurface) {
        clearSurface();
        surface = nextSurface;
      }

      pointerX = event.clientX;
      pointerY = event.clientY;
      if (frame !== null) return;

      frame = requestAnimationFrame(() => {
        frame = null;
        if (!surface) return;
        const bounds = surface.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        const horizontal = Math.max(0, Math.min(100, (pointerX - bounds.left) / bounds.width * 100));
        const vertical = Math.max(0, Math.min(100, (pointerY - bounds.top) / bounds.height * 100));
        surface.style.setProperty("--glass-x", `${horizontal}%`);
        surface.style.setProperty("--glass-y", `${vertical}%`);
        surface.setAttribute("data-glass-active", "true");
      });
    };

    const preferenceChanged = () => {
      if (!preference.matches) reset();
    };

    element.addEventListener("pointermove", move, { passive: true });
    element.addEventListener("pointerleave", reset);
    preference.addEventListener("change", preferenceChanged);
    return () => {
      reset();
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", reset);
      preference.removeEventListener("change", preferenceChanged);
    };
  }, []);

  return root;
}