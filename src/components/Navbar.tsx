import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { BrandLogo } from "./BrandLogo";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Home", href: "/", id: "home" },
  { name: "About", href: "/#about", id: "about" },
  { name: "Services", href: "/#services", id: "services" },
  { name: "Works", href: "/#works", id: "works" },
  { name: "Team", href: "/#team", id: "team" },
  { name: "Contact", href: "/#contact", id: "contact" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll spy: the site is a single page, so the nav should report position.
  useEffect(() => {
    const ids = navLinks.map((l) => l.id).filter((id) => id !== "home");
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        } else if (window.scrollY < 200) {
          setActiveSection("home");
        }
      },
      // Bias the band towards the upper half so the active link changes as a
      // section's heading reaches reading position, not when it fully fills.
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.1, 0.5, 1] },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Escape to close, and lock body scroll while the drawer is open.
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  // Close the drawer if the viewport grows past the mobile breakpoint.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => e.matches && setIsMobileMenuOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        aria-label="Main"
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled || isMobileMenuOpen
            ? "bg-background/90 backdrop-blur-xl border-b border-border/60 shadow-lg"
            : "bg-transparent",
        )}
      >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo — sized to sit inside the 80px bar, not overflow it */}
          <Link
            to="/"
            className="flex items-center rounded-md focus-ring"
            aria-label="Tobiya Game Studio — home"
          >
            <BrandLogo className="h-10 md:h-12 transition-transform duration-300 hover:scale-105" />
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                data-active={activeSection === link.id}
                aria-current={activeSection === link.id ? "true" : undefined}
                className={cn(
                  // py-3 keeps the hit area at the 44px target size
                  "hover-underline inline-flex min-h-[44px] items-center rounded-md px-3 py-3 text-sm font-medium transition-colors duration-300 focus-ring",
                  activeSection === link.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-primary",
                )}
              >
                {link.name}
              </a>
            ))}
            <span className="ml-2">
              <ThemeToggle />
            </span>
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-foreground focus-ring"
            >
              {isMobileMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>
      </motion.nav>

      {/* Mobile drawer.
          Rendered as a sibling of <motion.nav>, not a child: framer-motion applies
          a transform to the nav, and a transformed ancestor becomes the containing
          block for position:fixed descendants — which collapsed this drawer to 1px. */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="md:hidden fixed inset-x-0 top-20 bottom-0 z-40 bg-background border-t border-border overflow-y-auto"
          >
            <nav aria-label="Mobile" className="container mx-auto px-4 py-2 flex flex-col">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={activeSection === link.id ? "true" : undefined}
                  className={cn(
                    "rounded-md border-b border-border/40 px-2 py-4 text-lg font-medium transition-colors focus-ring",
                    activeSection === link.id
                      ? "text-primary"
                      : "text-foreground hover:text-primary",
                  )}
                >
                  {link.name}
                </a>
              ))}
              <a
                href="/#contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-primary px-6 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-ring"
              >
                Start a project
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
