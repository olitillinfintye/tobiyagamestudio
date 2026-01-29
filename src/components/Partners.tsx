import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Partner {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
}

export default function Partners() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [partners, setPartners] = useState<Partner[]>([]);

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

  if (partners.length === 0) {
    return null;
  }

  // Duplicate logos for seamless infinite scroll
  const duplicatedPartners = [...partners, ...partners, ...partners];

  return (
    <section id="partners" className="py-12 md:py-16 relative overflow-hidden bg-secondary/20" ref={ref}>
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
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
      <div className="relative">
        {/* Gradient Overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-r from-secondary/20 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-l from-secondary/20 to-transparent z-10 pointer-events-none" />

        {/* Scrolling Logos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex overflow-hidden"
        >
          <div className="flex animate-marquee">
            {duplicatedPartners.map((partner, index) => (
              <a
                key={`${partner.id}-${index}`}
                href={partner.website_url || "#"}
                target={partner.website_url ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="flex-shrink-0 mx-6 md:mx-10 group"
                title={partner.name}
              >
                <div className="w-24 h-16 md:w-32 md:h-20 flex items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300">
                  <img
                    src={partner.logo_url}
                    alt={partner.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
