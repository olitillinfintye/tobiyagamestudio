import { cn } from "@/lib/utils";

/**
 * Media-over-text card placeholder, matching the shape of the Portfolio,
 * Team and Blog cards so the swap to real data does not shift layout.
 */
export function CardSkeleton({ className, media = true }: { className?: string; media?: boolean }) {
  return (
    <div className={cn("glass-card overflow-hidden", className)} aria-hidden="true">
      {media && <div className="aspect-[16/10] w-full animate-pulse bg-muted" />}
      <div className="p-4 md:p-6 space-y-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

/** Screen-reader-only live message announcing a loading region. */
export function LoadingAnnouncer({ label }: { label: string }) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {label}
    </span>
  );
}

/** Neutral empty/error state for a section that has no content to show. */
export function SectionNotice({ title, description }: { title: string; description?: string }) {
  return (
    <div className="glass-card mx-auto max-w-md p-8 text-center">
      <p className="font-display text-display-sm font-semibold">{title}</p>
      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
