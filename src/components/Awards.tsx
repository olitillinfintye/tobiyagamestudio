import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { cms } from "@/integrations/cpanel/client";
import { Eyebrow } from "@/components/ui/eyebrow";

interface AwardItem {
  id: string;
  title: string;
  description: string | null;
  year: number | null;
  image_url: string | null;
}

export default function Awards() {
  const [awards, setAwards] = useState<AwardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cms
      .from("awards")
      .select("*")
      .order("display_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error("Failed to load awards:", error);
        setAwards(data ?? []);
        setLoading(false);
      });
  }, []);

  // The section carries no value without content — hide it rather than
  // rendering an empty shell or fabricated placeholder awards.
  if (!loading && awards.length === 0) return null;

  return (
    <section id="awards" aria-labelledby="awards-heading" className="section-padding relative">
      <div className="container mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
          className="vr-panel grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.2fr_2fr] lg:p-14"
        >
          <div className="relative">
            <Eyebrow>Recognition</Eyebrow>
            <h2 id="awards-heading" className="mt-3 text-3xl font-semibold leading-tight tracking-tight md:text-4xl text-balance">
              Recognised for pushing play forward.
            </h2>
            <p className="mt-4 text-muted-foreground text-pretty">
              Our work has been recognised internationally, showcasing Ethiopia's potential in the global XR and gaming industry.
            </p>
          </div>

          <ol className="relative grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {awards.map((award) => (
              <li key={award.id} className="border-l border-border pl-5">
                <span className="vr-gold block text-4xl font-semibold md:text-5xl">{award.year ?? "★"}</span>
                <h3 className="mt-2 text-base font-semibold leading-snug">{award.title}</h3>
                {award.description && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{award.description}</p>}
              </li>
            ))}
          </ol>
        </motion.div>
      </div>
    </section>
  );
}
