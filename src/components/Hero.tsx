import { motion } from "framer-motion";
import { ChevronDown, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";
import VRHeadset3D from "./VRHeadset3D";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HeroStat {
  number: string;
  label: string;
}

export default function Hero() {
  const [stats, setStats] = useState<HeroStat[]>([
    { number: "15+", label: "Projects" },
    { number: "6", label: "Team Members" },
    { number: "3", label: "Awards" },
    { number: "2+", label: "Years" },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", ["hero_projects", "hero_team_members", "hero_awards", "hero_years"]);

      if (data && data.length > 0) {
        const keyOrder = ["hero_projects", "hero_team_members", "hero_awards", "hero_years"];
        const sortedStats = keyOrder.map((key) => {
          const found = data.find((d: any) => d.key === key);
          return found ? { number: found.value, label: found.label } : null;
        }).filter(Boolean) as HeroStat[];
        
        if (sortedStats.length === 4) {
          setStats(sortedStats);
        }
      }
    };

    fetchStats();
  }, []);

  const scrollToWorks = () => {
    const element = document.getElementById("works");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 md:pt-0">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 grid-overlay opacity-50" />

      {/* Glow Effects */}
      <div className="absolute top-1/3 left-1/4 w-48 md:w-96 h-48 md:h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-36 md:w-72 h-36 md:h-72 bg-accent/10 rounded-full blur-3xl" />

      {/* 3D VR Headset - Hidden on mobile */}
      <div className="hidden md:block">
        <VRHeadset3D />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-4 md:mb-6"
        >
          <span className="inline-block px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium bg-primary/10 text-primary border border-primary/20">
            Ethiopia's Premier XR Studio
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 max-w-5xl mx-auto leading-tight"
        >
          We Create{" "}
          <span className="gradient-text">Interactive Worlds</span>{" "}
          That Inspire
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 md:mb-10 px-4"
        >
          We create interactive worlds that inspire exploration, foster connection, and redefine the boundaries of play.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 px-4"
        >
          <Button
            size="lg"
            onClick={scrollToWorks}
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 glow-primary px-6 md:px-8 py-5 md:py-6 text-base md:text-lg font-semibold"
          >
            Explore Our Work
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto border-border/50 text-foreground hover:bg-card/50 px-6 md:px-8 py-5 md:py-6 text-base md:text-lg"
          >
            <Play className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Watch Showreel
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-12 md:mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-3xl mx-auto px-4"
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="font-display text-2xl md:text-4xl font-bold gradient-text mb-1">
                {stat.number}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-muted-foreground cursor-pointer"
          onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
        >
          <span className="text-sm">Scroll to explore</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>
  );
}
