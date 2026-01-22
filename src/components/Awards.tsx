import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Trophy, Star, Medal, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AwardItem {
  id: string;
  title: string;
  description: string | null;
  year: number | null;
  image_url: string | null;
}

const defaultAwards: AwardItem[] = [
  {
    id: "1",
    title: "1st Place - Cyber Game Jam",
    description: "Won first place at the Cyber Game Jam competition with our innovative VR game 'Immersion Breach VR'.",
    year: 2025,
    image_url: null,
  },
  {
    id: "2",
    title: "3rd Place - Fak'ugesi Festival",
    description: "Earned 3rd place at the prestigious Fak'ugesi Festival in South Africa, competing against international teams.",
    year: 2025,
    image_url: null,
  },
  {
    id: "3",
    title: "Rising Star in XR",
    description: "Awarded 'Rising Star' title in XR category from 14 nominees at Fak'ugesi Awards.",
    year: 2025,
    image_url: null,
  },
  {
    id: "4",
    title: "INSA Recognition",
    description: "Received recognition from Information Network Security Administration Director and Gaming PC award.",
    year: 2025,
    image_url: null,
  },
  {
    id: "5",
    title: "First Ethiopian Games at Goethe",
    description: "Showcased the first Ethiopian games at Goethe-Institut Addis Ababa, marking a historic milestone.",
    year: 2025,
    image_url: null,
  },
];

const icons = [Trophy, Star, Medal, Award, Star];

export default function Awards() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [awards, setAwards] = useState<AwardItem[]>(defaultAwards);

  useEffect(() => {
    fetchAwards();
  }, []);

  const fetchAwards = async () => {
    try {
      const { data, error } = await supabase
        .from("awards")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        setAwards(data);
      }
    } catch (error) {
      console.log("Using default awards data");
    }
  };

  return (
    <section className="section-padding relative overflow-hidden" ref={ref}>
      {/* Background Glow */}
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-accent/10 text-accent border border-accent/20 mb-4">
            Recognition
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
            Awards & <span className="gradient-text-gold">Achievements</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Our work has been recognized internationally, showcasing Ethiopia's potential in the global XR and gaming industry.
          </p>
        </motion.div>

        {/* Awards Timeline */}
        <div className="max-w-4xl mx-auto">
          {awards.map((award, index) => {
            const Icon = icons[index % icons.length];
            return (
              <motion.div
                key={award.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.15 * index }}
                className="relative flex items-start gap-6 mb-8 last:mb-0"
              >
                {/* Icon */}
                <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 flex items-center justify-center">
                  <Icon className="w-8 h-8 text-accent" />
                </div>

                {/* Content */}
                <div className="flex-1 glass-card p-6 relative overflow-hidden group hover:border-accent/50 transition-colors">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display text-xl font-bold">{award.title}</h3>
                      {award.year && (
                        <span className="award-badge">
                          <Star className="w-3 h-3" />
                          {award.year}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground">{award.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Featured Achievement */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-gradient-to-r from-accent/10 via-accent/5 to-accent/10 border border-accent/20">
            <Trophy className="w-8 h-8 text-accent" />
            <div className="text-left">
              <p className="text-sm text-accent font-medium">Featured Achievement</p>
              <p className="font-display text-lg font-bold">First Ethiopian Games Showcased Internationally</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
