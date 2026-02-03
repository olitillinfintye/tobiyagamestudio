import { motion } from "framer-motion";
import { ChevronDown, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import heroBg from "@/assets/hero-bg.jpg";
import VRHeadset3D from "./VRHeadset3D";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Helper function to convert YouTube URL to embed URL
const getYouTubeEmbedUrl = (url: string): string => {
  let videoId = '';
  
  // Handle youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) {
    videoId = watchMatch[1];
  }
  
  // Handle youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) {
    videoId = shortMatch[1];
  }
  
  // Handle youtube.com/embed/VIDEO_ID (already embed format)
  const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);
  if (embedMatch) {
    videoId = embedMatch[1];
  }
  
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
};

// Helper function to convert Vimeo URL to embed URL
const getVimeoEmbedUrl = (url: string): string => {
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }
  return url;
};
interface HeroStat {
  number: string;
  label: string;
}
export default function Hero() {
  const [stats, setStats] = useState<HeroStat[]>([{
    number: "15+",
    label: "Projects"
  }, {
    number: "6",
    label: "Team Members"
  }, {
    number: "3",
    label: "Awards"
  }, {
    number: "2+",
    label: "Years"
  }]);
  const [showreelOpen, setShowreelOpen] = useState(false);
  const [showreelUrl, setShowreelUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", ["hero_projects", "hero_team_members", "hero_awards", "hero_years", "showreel_video_url"]);
      
      if (data && data.length > 0) {
        const keyOrder = ["hero_projects", "hero_team_members", "hero_awards", "hero_years"];
        const sortedStats = keyOrder.map(key => {
          const found = data.find((d: any) => d.key === key);
          return found ? {
            number: found.value,
            label: found.label
          } : null;
        }).filter(Boolean) as HeroStat[];
        if (sortedStats.length === 4) {
          setStats(sortedStats);
        }
        
        const showreelSetting = data.find((d: any) => d.key === "showreel_video_url");
        if (showreelSetting) {
          setShowreelUrl(showreelSetting.value);
        }
      }
    };
    fetchStats();
  }, []);
  const scrollToWorks = () => {
    const element = document.getElementById("works");
    if (element) {
      element.scrollIntoView({
        behavior: "smooth"
      });
    }
  };
  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 md:pt-0 w-full max-w-full">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 grid-overlay opacity-50" />

      {/* Glow Effects - contained within viewport */}
      <div className="absolute top-1/3 left-0 md:left-1/4 w-32 md:w-96 h-32 md:h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-0 md:right-1/4 w-24 md:w-72 h-24 md:h-72 bg-accent/10 rounded-full blur-3xl" />

      {/* 3D VR Headset - Hidden on mobile */}
      <div className="hidden md:block">
        <VRHeadset3D />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 text-center w-full max-w-full box-border">
        <motion.div initial={{
        opacity: 0,
        y: 40
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.8,
        delay: 0.2
      }} className="mb-4 md:mb-6">
          
        </motion.div>

        <motion.h1 initial={{
        opacity: 0,
        y: 40
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.8,
        delay: 0.4
      }} className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 max-w-5xl mx-auto leading-tight">
          We Create{" "}
          <span className="gradient-text">Interactive Worlds</span>{" "}
          That Inspire
        </motion.h1>

        <motion.p initial={{
        opacity: 0,
        y: 40
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.8,
        delay: 0.6
      }} className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 md:mb-10 px-4">
          We create interactive worlds that inspire exploration, foster connection, and redefine the boundaries of play.
        </motion.p>

        <motion.div initial={{
        opacity: 0,
        y: 40
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.8,
        delay: 0.8
      }} className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 px-4">
          <Button size="lg" onClick={scrollToWorks} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 glow-primary px-6 md:px-8 py-5 md:py-6 text-base md:text-lg font-semibold">
            Explore Our Work
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="w-full sm:w-auto border-border/50 text-foreground hover:bg-card/50 px-6 md:px-8 py-5 md:py-6 text-base md:text-lg"
            onClick={() => setShowreelOpen(true)}
          >
            <Play className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Watch Showreel
          </Button>
        </motion.div>

        {/* Showreel Video Dialog */}
        <Dialog open={showreelOpen} onOpenChange={setShowreelOpen}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background/95 backdrop-blur-lg border-border/50">
            <DialogTitle className="sr-only">Showreel Video</DialogTitle>
            <div className="relative aspect-video">
            {showreelUrl ? (
                showreelUrl.includes('youtube.com') || showreelUrl.includes('youtu.be') ? (
                  <iframe
                    src={getYouTubeEmbedUrl(showreelUrl)}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title="Showreel"
                  />
                ) : showreelUrl.includes('vimeo.com') ? (
                  <iframe
                    src={getVimeoEmbedUrl(showreelUrl)}
                    className="w-full h-full"
                    allowFullScreen
                    allow="autoplay; fullscreen; picture-in-picture"
                    title="Showreel"
                  />
                ) : (
                  <video
                    src={showreelUrl}
                    className="w-full h-full"
                    controls
                    autoPlay
                    title="Showreel"
                  />
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-muted/20 text-muted-foreground">
                  <Play className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg">Showreel video not configured</p>
                  <p className="text-sm">Please add a video URL in the admin settings</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Stats */}
        <motion.div initial={{
        opacity: 0,
        y: 40
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.8,
        delay: 1
      }} className="mt-12 md:mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-3xl mx-auto px-4">
          {stats.map((stat, index) => <div key={index} className="text-center">
              <div className="font-display text-2xl md:text-4xl font-bold gradient-text mb-1">
                {stat.number}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
            </div>)}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      delay: 1.5
    }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <motion.div animate={{
        y: [0, 10, 0]
      }} transition={{
        duration: 2,
        repeat: Infinity
      }} className="flex flex-col items-center gap-2 text-muted-foreground cursor-pointer" onClick={() => document.getElementById("about")?.scrollIntoView({
        behavior: "smooth"
      })}>
          <span className="text-sm">Scroll to explore</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>;
}