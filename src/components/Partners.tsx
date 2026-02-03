import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Partner {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
}

export default function Partners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);

  useEffect(() => {
    const fetchPartners = async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (!error && data) {
        setPartners(data);
      }
    };

    fetchPartners();
  }, []);

  // Measure the width of one set of logos
  useEffect(() => {
    if (scrollRef.current && partners.length > 0) {
      // Each logo container is approximately 160px (w-32 + margins)
      const logoWidth = 160;
      setScrollWidth(logoWidth * partners.length);
    }
  }, [partners]);

  if (partners.length === 0) {
    return null;
  }

  // Duplicate partners array for seamless infinite scroll
  const duplicatedPartners = [...partners, ...partners];
  const duration = partners.length * 2.5; // Adjust speed here

  return (
    <section id="partners" className="py-12 md:py-16 relative overflow-hidden bg-secondary/20">
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20 mb-4">
            Trusted By
          </span>
          <h2 className="font-display text-2xl md:text-3xl font-bold">
            Our <span className="gradient-text">Partners</span>
          </h2>
        </motion.div>
      </div>

      {/* Marquee Container */}
      <div 
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Gradient Overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* Scrolling Logos */}
        <div className="overflow-hidden py-4">
          <motion.div
            ref={scrollRef}
            className="flex items-center"
            animate={{
              x: isPaused ? undefined : [-scrollWidth, 0],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: duration,
                ease: "linear",
              },
            }}
            style={{ width: "fit-content" }}
          >
            {duplicatedPartners.map((partner, index) => (
              <motion.a
                key={`${partner.id}-${index}`}
                href={partner.website_url || "#"}
                target={partner.website_url ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="flex-shrink-0 mx-6 md:mx-10"
                title={partner.name}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <div className="w-24 h-16 md:w-32 md:h-20 flex items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300">
                  <img
                    src={partner.logo_url}
                    alt={partner.name}
                    className="max-w-full max-h-full object-contain"
                    loading="lazy"
                  />
                </div>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
