import { motion } from "framer-motion";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  /** Small pill above the heading, e.g. "What We Do". */
  eyebrow: string;
  /** Heading content. Wrap the emphasised phrase in a `.gradient-text` span. */
  title: React.ReactNode;
  description?: string;
  tone?: "primary" | "accent";
  /** Id for the h2, so the parent <section> can point aria-labelledby at it. */
  id?: string;
  className?: string;
}

/**
 * Shared section intro. Replaces the identical ~14-line motion block that was
 * duplicated across About, Services, Portfolio, Team, Awards, Blog and Contact.
 *
 * Uses `whileInView` rather than a useRef/useInView pair, which removes a ref
 * and a re-render from every consuming section.
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  tone = "primary",
  id,
  className,
}: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className={cn("text-center mb-14 md:mb-16", className)}
    >
      <Eyebrow tone={tone} className="mb-4">
        {eyebrow}
      </Eyebrow>
      <h2 id={id} className="font-display text-display-lg font-bold mb-5 text-balance">
        {title}
      </h2>
      {description && (
        <p className="text-muted-foreground max-w-2xl mx-auto text-body-lg text-pretty">
          {description}
        </p>
      )}
    </motion.div>
  );
}
