import { motion, useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { lazy, Suspense, useEffect, useState } from "react";
import { cms } from "@/integrations/cpanel/client";
import { getEmbedUrl } from "@/lib/products";

const Quest3Model = lazy(() => import("./Quest3Model"));

interface HeroStat {
  number: string;
  label: string;
}

const defaultStats: HeroStat[] = [
  { number: "15+", label: "Projects" },
  { number: "6", label: "Team Members" },
  { number: "3", label: "Awards" },
  { number: "2+", label: "Years" },
];

/** "15+" → ["15", "+"] so the suffix can be tinted. */
const splitStat = (value: string) => {
  const m = value.match(/^([\d.,]+)(.*)$/);
  return m ? [m[1], m[2]] : [value, ""];
};

export default function Hero() {
  const [stats, setStats] = useState<HeroStat[]>(defaultStats);
  const [showreelOpen, setShowreelOpen] = useState(false);
  const [showreelUrl, setShowreelUrl] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await cms
        .from("site_settings")
        .select("*")
        .in("key", ["hero_projects", "hero_team_members", "hero_awards", "hero_years", "showreel_video_url"]);
      if (!data || data.length === 0) return;

      const keyOrder = ["hero_projects", "hero_team_members", "hero_awards", "hero_years"];
      const sortedStats = keyOrder
        .map((key) => {
          const found = data.find((d: { key: string }) => d.key === key);
          return found ? { number: found.value, label: found.label ?? key } : null;
        })
        .filter(Boolean) as HeroStat[];
      if (sortedStats.length === 4) setStats(sortedStats);

      const showreel = data.find((d: { key: string }) => d.key === "showreel_video_url");
      if (showreel?.value) setShowreelUrl(showreel.value);
    };
    fetchStats();
  }, []);

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, delay, ease: [0.2, 0.7, 0.2, 1] },
  });

  const embed = showreelUrl ? getEmbedUrl(showreelUrl) : null;

  return (
    <section
      aria-labelledby="hero-heading"
      className="container mx-auto grid min-h-[100svh] items-center gap-4 px-5 pb-12 pt-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pt-24"
    >
      <div className="order-2 text-center lg:order-1 lg:text-left">
        <motion.span {...fadeUp(0.1)} className="vr-chip mono">
          <span className="tag">LIVE</span>
          <span className="dot" aria-hidden="true" />
          Game dev · XR · Spatial computing
        </motion.span>

        <motion.h1
          {...fadeUp(0.2)}
          id="hero-heading"
          className="my-6 font-display text-[clamp(2.4rem,5.6vw,5rem)] font-bold leading-[0.95] tracking-[-0.035em]"
        >
          We open doors
          <br />
          to <span className="holo-text">new worlds.</span>
        </motion.h1>

        <motion.p {...fadeUp(0.35)} className="mx-auto max-w-[520px] text-base leading-relaxed text-muted-foreground md:text-lg lg:mx-0">
          Tobiya Game Studio crafts immersive games and spatial experiences from Addis Ababa — blending the digital and the physical across VR, AR and beyond.
        </motion.p>

        <motion.div {...fadeUp(0.5)} className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
          <a href="#works" className="vr-btn-prime inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold focus-ring">
            Explore our worlds ↗
          </a>
          {showreelUrl && (
            <button
              type="button"
              onClick={() => setShowreelOpen(true)}
              className="vr-btn-ghost inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold focus-ring"
            >
              <Play className="h-4 w-4" aria-hidden="true" /> Watch showreel
            </button>
          )}
        </motion.div>

        <motion.dl {...fadeUp(0.65)} className="mx-auto mt-12 grid max-w-[560px] grid-cols-2 gap-y-4 border-t border-border sm:grid-cols-4 lg:mx-0">
          {stats.map((stat) => {
            const [num, suffix] = splitStat(stat.number);
            return (
              <div key={stat.label} className="pt-4">
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block text-3xl font-semibold">
                    {num}
                    <span className="text-primary">{suffix}</span>
                  </span>
                  <span className="mono text-muted-foreground" aria-hidden="true">
                    {stat.label}
                  </span>
                </dd>
              </div>
            );
          })}
        </motion.dl>
      </div>

      {/* 3D stage */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.2 }}
        className="relative order-1 h-[320px] sm:h-[420px] lg:order-2 lg:h-[600px]"
      >
        <span className="vr-ring r1" />
        <span className="vr-ring r2" />
        <span className="vr-corner left-[8%] top-6 hidden border-l-2 border-t-2 md:block" />
        <span className="vr-corner right-[8%] top-6 hidden border-r-2 border-t-2 md:block" />
        <span className="vr-corner bottom-6 right-[8%] hidden border-b-2 border-r-2 md:block" />

        <Suspense fallback={null}>
          <Quest3Model />
        </Suspense>

        <div className="vr-hud left-0 top-2 sm:top-16" aria-hidden="true">
          <div className="mono">◉ Tracking</div>
          6DoF · 120 Hz
          <div className="bar"><i /></div>
        </div>
        <div className="vr-hud bottom-2 right-0 max-w-[180px] sm:bottom-24 sm:max-w-none" style={{ animationDelay: "-2s" }} aria-hidden="true">
          <div className="mono">Now building</div>
          Spatial worlds for Quest &amp; Vision Pro
        </div>
        <div className="vr-hud bottom-6 left-10 hidden md:block" style={{ animationDelay: "-3.5s" }} aria-hidden="true">
          <div className="mono">Location</div>
          9.03°N · 38.74°E — Addis Ababa
        </div>
      </motion.div>

      <Dialog open={showreelOpen} onOpenChange={setShowreelOpen}>
        <DialogContent className="max-w-4xl overflow-hidden p-0">
          <DialogTitle className="sr-only">Showreel video</DialogTitle>
          <div className="aspect-video bg-black">
            {embed &&
              (embed.kind === "iframe" ? (
                <iframe
                  src={`${embed.src}?autoplay=1`}
                  className="h-full w-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  title="Tobiya Game Studio showreel"
                />
              ) : (
                <video src={embed.src} className="h-full w-full" controls autoPlay title="Showreel" />
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
