import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  // resolvedTheme, not theme — with the provider set to follow the system
  // preference, `theme` is the literal string "system".
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Placeholder keeps the bar from shifting before the theme is known.
  if (!mounted) {
    return <div className="h-11 w-11" aria-hidden="true" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="h-11 w-11 text-muted-foreground transition-colors hover:text-foreground"
    >
      {isDark ? (
        <Sun className="h-5 w-5 transition-transform hover:rotate-12" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5 transition-transform hover:-rotate-12" aria-hidden="true" />
      )}
    </Button>
  );
}
