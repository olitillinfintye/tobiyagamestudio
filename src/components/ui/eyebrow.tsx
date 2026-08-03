import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const eyebrowVariants = cva(
  "inline-block rounded-full border px-4 py-2 text-sm font-medium",
  {
    variants: {
      tone: {
        primary: "bg-primary/10 text-primary border-primary/30",
        accent: "bg-accent/10 text-accent border-accent/30",
      },
    },
    defaultVariants: { tone: "primary" },
  },
);

export interface EyebrowProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof eyebrowVariants> {}

/** Small labelled pill that introduces a section heading. */
export function Eyebrow({ className, tone, ...props }: EyebrowProps) {
  return <span className={cn(eyebrowVariants({ tone }), className)} {...props} />;
}
