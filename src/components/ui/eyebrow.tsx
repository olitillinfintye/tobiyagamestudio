import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const eyebrowVariants = cva("mono inline-flex items-center gap-2", {
  variants: {
    tone: {
      primary: "text-primary",
      accent: "text-accent",
    },
  },
  defaultVariants: { tone: "primary" },
});

export interface EyebrowProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof eyebrowVariants> {}

/** Small monospace label that introduces a section heading. */
export function Eyebrow({ className, tone, ...props }: EyebrowProps) {
  return <span className={cn(eyebrowVariants({ tone }), className)} {...props} />;
}
