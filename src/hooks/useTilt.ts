import { useCallback } from "react";

/**
 * Pointer-driven 3D tilt with a light that follows the cursor (`--mx`/`--my`).
 * Disabled for touch and reduced-motion users.
 */
export function useTilt(strength = 14) {
  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.transform = `perspective(1200px) rotateY(${(x - 0.5) * strength}deg) rotateX(${(0.5 - y) * strength}deg) translateZ(10px)`;
      el.style.setProperty("--mx", `${x * 100}%`);
      el.style.setProperty("--my", `${y * 100}%`);
    },
    [strength],
  );
  const onPointerLeave = useCallback((e: React.PointerEvent<HTMLElement>) => {
    e.currentTarget.style.transform = "";
  }, []);
  return { onPointerMove, onPointerLeave };
}
