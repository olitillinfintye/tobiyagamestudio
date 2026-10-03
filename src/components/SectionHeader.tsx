import { motion } from "framer-motion";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  /** Small monospace label above the heading, e.g. "Capabilities". */
  eyebrow: string;
  /** Heading content. Wrap the emphasised phrase in a `.gradient-text` span. */
  title: React.ReactNode;
  description?: string;
  tone?: "primary" | "accent";
  /** Id for the h2, so the parent <section> can point aria-labelledby at it. */
  id?: string;
  className?: string;
  /** Optional element on the right (e.g. a "View all" button). Replaces the description slot. */
  action?: React.ReactNode;
}

/** Shared section intro: label + large heading on the left, supporting copy on the right. */
export function SectionHeader({ eyebrow, title, description, tone = "primary", id, className, action }: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
      className={cn("mb-12 md:mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between", className)}
    >
      <div>
        <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
        <h2 id={id} className="mt-3 font-display text-[clamp(2.25rem,4.4vw,3.75rem)] font-semibold leading-none tracking-[-0.03em] text-balance">
          {title}
        </h2>
      </div>
      {action ?? (description && <p className="max-w-sm text-muted-foreground leading-relaxed text-pretty">{description}</p>)}
    </motion.div>
  );
}
