import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import heroBg from "@/assets/hero-bg.jpg";
import { lazy, Suspense, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const VRHeadset3D = lazy(() => import("./VRHeadset3D"));

/** Convert a YouTube watch/short/embed URL into an autoplaying embed URL. */
const getYouTubeEmbedUrl = (url: string): string => {
  const videoId =
    url.match(/[?&]v=([^&]+)/)?.[1] ??
    url.match(/youtu\.be\/([^?&]+)/)?.[1] ??
    url.match(/youtube\.com\/embed\/([^?&]+)/)?.[1] ??
    "";

  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
};

const getVimeoEmbedUrl = (url: string): string => {
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  return vimeoMatch ? `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1` : url;
};

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

export default function Hero() {
  const [stats, setStats] = useState<HeroStat[]>(defaultStats);
  const [showreelOpen, setShowreelOpen] = useState(false);
  const [showreelUrl, setShowreelUrl] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", [
          "hero_projects",
          "hero_team_members",
          "hero_awards",
          "hero_years",
          "showreel_video_url",
        ]);

      if (!data || data.length === 0) return;

      const keyOrder = ["hero_projects", "hero_team_members", "hero_awards", "hero_years"];
      const sortedStats = keyOrder
        .map((key) => {
          const found = data.find((d: { key: string }) => d.key === key);
          return found ? { number: found.value, label: found.label } : null;
        })
        .filter(Boolean) as HeroStat[];

      if (sortedStats.length === 4) setStats(sortedStats);

      const showreelSetting = data.find((d: { key: string }) => d.key === "showreel_video_url");
      if (showreelSetting) setShowreelUrl(showreelSetting.value);
    };

    fetchStats();
  }, []);

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay },
  });

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative min-h-[100svh] flex items-center overflow-hidden pt-24 pb-16 md:pt-20 md:pb-0"
    >
      {/* Background image.
          The source art contains its own large headset, which competes with the
          3D model for subject. Scaling up, blurring and heavily washing it turns
          it into an abstract environment so the 3D model reads as the subject. */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={heroBg}
          alt=""
          width={1920}
          height={1080}
          fetchPriority="high"
          className="w-full h-full object-cover scale-125 blur-[3px] opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/75 to-background" />
        {/* Left-side scrim: guarantees headline legibility over any artwork */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent lg:to-background/10" />
      </div>

      <div className="absolute inset-0 grid-overlay opacity-50" />

      {/* Ambient glows */}
      <div className="absolute top-1/3 left-0 md:left-1/4 w-32 md:w-96 h-32 md:h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-0 md:right-1/4 w-24 md:w-72 h-24 md:h-72 bg-accent/10 rounded-full blur-3xl" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 w-full">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-12 items-center">
          {/* Copy column */}
          <div className="text-center lg:text-left">
            <motion.h1
              {...fadeUp(0.2)}
              id="hero-heading"
              className="font-display text-display-xl font-bold mb-5 text-balance"
            >
              We Create <span className="gradient-text">Interactive Worlds</span> That Inspire
            </motion.h1>

            <motion.p
              {...fadeUp(0.35)}
              className="text-body-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 text-pretty"
            >
              We create interactive worlds that inspire exploration, foster connection, and redefine
              the boundaries of play.
            </motion.p>

            <motion.div
              {...fadeUp(0.5)}
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 md:gap-4"
            >
              <Button
                size="lg"
                asChild
                className="h-12 md:h-14 px-8 text-base md:text-lg font-semibold glow-primary"
              >
                <a href="#works">Explore Our Work</a>
              </Button>

              {/* Explicit outline treatment — the default `outline` variant resolves
                  to background-on-background and disappears in both themes. */}
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowreelOpen(true)}
                className="h-12 md:h-14 px-8 text-base md:text-lg border-2 border-primary/60 bg-background/40 text-foreground backdrop-blur-sm hover:bg-primary/10 hover:border-primary"
              >
                <Play className="w-5 h-5 mr-2" aria-hidden="true" />
                Watch Showreel
              </Button>
            </motion.div>

            {/* Stats — anchored in a card so they read as a credibility bar */}
            <motion.dl
              {...fadeUp(0.65)}
              className="mt-10 md:mt-12 glass-card grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border/60 overflow-hidden"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="px-4 py-5 text-center">
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block font-display text-display-md font-bold gradient-text">
                      {stat.number}
                    </span>
                    <span className="mt-1 block text-xs md:text-sm text-muted-foreground">
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </motion.dl>
          </div>

          {/* 3D column — a composed subject, not a full-bleed backdrop.
              Skipped entirely for reduced-motion users and below `lg`. */}
          <div className="hidden lg:block relative h-[520px]">
            {!prefersReducedMotion && (
              <Suspense fallback={null}>
                <VRHeadset3D />
              </Suspense>
            )}
          </div>
        </div>
      </div>

      {/* Showreel dialog */}
      <Dialog open={showreelOpen} onOpenChange={setShowreelOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background/95 backdrop-blur-lg border-border">
          <DialogTitle className="sr-only">Showreel video</DialogTitle>
          <div className="relative aspect-video">
            {showreelUrl ? (
              showreelUrl.includes("youtube.com") || showreelUrl.includes("youtu.be") ? (
                <iframe
                  src={getYouTubeEmbedUrl(showreelUrl)}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title="Tobiya Game Studio showreel"
                />
              ) : showreelUrl.includes("vimeo.com") ? (
                <iframe
                  src={getVimeoEmbedUrl(showreelUrl)}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; fullscreen; picture-in-picture"
                  title="Tobiya Game Studio showreel"
                />
              ) : (
                <video src={showreelUrl} className="w-full h-full" controls autoPlay title="Showreel" />
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-muted/20 text-muted-foreground">
                <Play className="w-16 h-16 mb-4 opacity-50" aria-hidden="true" />
                <p className="text-lg">Showreel coming soon</p>
                <p className="text-sm">A video URL has not been configured yet.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Scroll cue */}
      <motion.a
        href="#about"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        aria-label="Scroll to the About section"
        className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 rounded-md p-2 text-muted-foreground hover:text-foreground transition-colors focus-ring"
      >
        <span className="text-sm">Scroll to explore</span>
        <motion.span
          animate={prefersReducedMotion ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-5 h-5" aria-hidden="true" />
        </motion.span>
      </motion.a>
    </section>
  );
}
