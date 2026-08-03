import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Trophy, Star, Medal, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeader } from "./SectionHeader";

interface AwardItem {
  id: string;
  title: string;
  description: string | null;
  year: number | null;
  image_url: string | null;
}

const icons = [Trophy, Star, Medal, Award];

export default function Awards() {
  const [awards, setAwards] = useState<AwardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAwards = async () => {
      try {
        const { data, error } = await supabase
          .from("awards")
          .select("*")
          .order("display_order", { ascending: true });

        if (error) throw error;
        setAwards(data ?? []);
      } catch (error) {
        console.error("Failed to load awards:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAwards();
  }, []);

  // The section carries no value without content — hide it rather than
  // rendering an empty shell or fabricated placeholder awards.
  if (!loading && awards.length === 0) return null;

  return (
    <section
      id="awards"
      aria-labelledby="awards-heading"
      className="section-padding relative overflow-hidden"
    >
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        <SectionHeader
          id="awards-heading"
          eyebrow="Recognition"
          tone="accent"
          title={
            <>
              Awards & <span className="gradient-text-gold">Achievements</span>
            </>
          }
          description="Our work has been recognized internationally, showcasing Ethiopia's potential in the global XR and gaming industry."
        />

        <ol className="relative mx-auto max-w-5xl">
          {/* Connecting rule — the icon tiles previously implied a timeline
              that was never actually drawn. */}
          <span
            aria-hidden="true"
            className="absolute left-6 md:left-8 top-6 bottom-6 w-px -translate-x-1/2 bg-gradient-to-b from-accent/40 via-accent/20 to-transparent"
          />

          {awards.map((award, index) => {
            const Icon = icons[index % icons.length];

            return (
              <motion.li
                key={award.id}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: Math.min(0.08 * index, 0.3) }}
                className="relative flex items-start gap-4 md:gap-6 mb-6 last:mb-0"
              >
                <div className="relative z-10 shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/40 flex items-center justify-center backdrop-blur-sm">
                  <Icon className="w-6 h-6 md:w-7 md:h-7 text-accent" aria-hidden="true" />
                </div>

                <div className="flex-1 glass-card p-4 md:p-6 relative overflow-hidden group hover:border-accent/50 transition-colors">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors" />
                  <div className="relative">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                      <h3 className="font-display text-base md:text-xl font-bold">{award.title}</h3>
                      {award.year && (
                        <span className="award-badge px-3 py-1 text-xs">
                          <Star className="w-3 h-3" aria-hidden="true" />
                          {award.year}
                        </span>
                      )}
                    </div>
                    {award.description && (
                      <p className="text-sm md:text-base text-muted-foreground text-pretty">
                        {award.description}
                      </p>
                    )}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ol>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-14 flex justify-center"
        >
          <div className="inline-flex max-w-5xl items-center gap-4 rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/10 via-accent/5 to-accent/10 px-6 py-4 md:px-8">
            <Trophy className="w-8 h-8 shrink-0 text-accent" aria-hidden="true" />
            <div className="text-left">
              <p className="text-sm font-medium text-accent">Featured Achievement</p>
              <p className="font-display text-base md:text-lg font-bold text-balance">
                First Ethiopian Games Showcased Internationally
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
