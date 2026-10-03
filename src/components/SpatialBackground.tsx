import { useEffect, useRef } from "react";

/**
 * Fixed ambient "world" behind the public pages: glowing orbs, a moving
 * perspective grid floor, film grain and a soft cursor light.
 */
export function SpatialBackground() {
  const glow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!glow.current) return;
      glow.current.style.left = `${e.clientX}px`;
      glow.current.style.top = `${e.clientY}px`;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <>
      <div className="vr-world" aria-hidden="true">
        <div className="orb a" />
        <div className="orb b" />
        <div className="orb c" />
        <div className="floor" />
        <div className="noise" />
      </div>
      <div ref={glow} className="vr-cursor-glow" aria-hidden="true" style={{ left: -999, top: -999 }} />
    </>
  );
}
