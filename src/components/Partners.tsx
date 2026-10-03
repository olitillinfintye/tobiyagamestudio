import { useEffect, useState } from "react";
import { cms } from "@/integrations/cpanel/client";

interface Partner {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
}

type Trimmed = { src: string; background?: string };

/**
 * Crops the empty margins baked into uploaded logos so the mark fills its tile,
 * and matches the tile colour for logos that ship on a solid background.
 * Falls back to the original image if the file can't be read (e.g. no CORS).
 */
function useTrimmedLogo(url: string): Trimmed {
  const [result, setResult] = useState<Trimmed>({ src: url });

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const k = Math.min(1, 400 / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * k));
        const h = Math.max(1, Math.round(img.height * k));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const d = ctx.getImageData(0, 0, w, h).data;
        const [r0, g0, b0, a0] = [d[0], d[1], d[2], d[3]];
        const white = r0 > 235 && g0 > 235 && b0 > 235;
        const isBackground = (i: number) => {
          if (d[i + 3] < 20) return true;
          if (a0 < 20) return false;
          return Math.abs(d[i] - r0) + Math.abs(d[i + 1] - g0) + Math.abs(d[i + 2] - b0) < 40;
        };
        let x1 = w, y1 = h, x2 = -1, y2 = -1;
        for (let y = 0; y < h; y++)
          for (let x = 0; x < w; x++)
            if (!isBackground((y * w + x) * 4)) {
              if (x < x1) x1 = x;
              if (x > x2) x2 = x;
              if (y < y1) y1 = y;
              if (y > y2) y2 = y;
            }
        if (x2 < 0 || cancelled) return;
        const out = document.createElement("canvas");
        out.width = x2 - x1 + 1;
        out.height = y2 - y1 + 1;
        out.getContext("2d")?.drawImage(canvas, x1, y1, out.width, out.height, 0, 0, out.width, out.height);
        setResult({ src: out.toDataURL(), background: a0 > 200 && !white ? `rgb(${r0},${g0},${b0})` : undefined });
      } catch {
        /* Cross-origin image without CORS — keep the original. */
      }
    };
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [url]);

  return result;
}

function PartnerLogo({ partner, hidden }: { partner: Partner; hidden: boolean }) {
  const logo = useTrimmedLogo(partner.logo_url);
  const content = <img src={logo.src} alt={hidden ? "" : partner.name} loading="lazy" decoding="async" />;
  const style = logo.background ? { background: logo.background } : undefined;

  if (!partner.website_url) {
    return (
      <span className="vr-logo" style={style} title={partner.name} aria-hidden={hidden || undefined}>
        {content}
      </span>
    );
  }
  return (
    <a
      className="vr-logo"
      style={style}
      href={partner.website_url}
      target="_blank"
      rel="noopener noreferrer"
      title={partner.name}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
    >
      {content}
      {!hidden && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}

export default function Partners() {
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    cms
      .from("partners")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .then(({ data, error }) => !error && data && setPartners(data));
  }, []);

  if (partners.length === 0) return null;

  return (
    <section id="partners" aria-labelledby="partners-heading" className="pb-5 pt-14">
      <div className="container mx-auto mb-6 flex flex-col justify-between gap-1 px-5 sm:flex-row">
        <h2 id="partners-heading" className="mono text-primary">
          Trusted by partners &amp; collaborators
        </h2>
        <span className="mono text-muted-foreground">{partners.length} partners</span>
      </div>
      <div className="vr-belt">
        {/* Duplicated for a seamless loop; the copy is hidden from assistive tech. */}
        <div className="track">
          {[...partners, ...partners].map((partner, index) => (
            <PartnerLogo key={`${partner.id}-${index}`} partner={partner} hidden={index >= partners.length} />
          ))}
        </div>
      </div>
    </section>
  );
}
