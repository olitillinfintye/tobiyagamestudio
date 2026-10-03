import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import { cn } from "@/lib/utils";
import { useHiddenSections, type SectionId } from "@/lib/sections";

const allNavLinks: { name: string; href: string; id: string }[] = [
  { name: "Studio", href: "/", id: "home" },
  { name: "About", href: "/#about", id: "about" },
  { name: "Services", href: "/#services", id: "services" },
  { name: "Works", href: "/#works", id: "works" },
  { name: "Products", href: "/products", id: "products" },
  { name: "Team", href: "/#team", id: "team" },
  { name: "Contact", href: "/#contact", id: "contact" },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const { pathname } = useLocation();
  const { isHidden } = useHiddenSections();
  const navLinks = allNavLinks.filter((l) => l.id === "home" || !isHidden(l.id as SectionId));
  const current = pathname.startsWith("/products") ? "products" : pathname.startsWith("/projects") ? "works" : pathname === "/" ? activeSection : "";

  // Scroll spy: the home page is a single page, so the nav reports position.
  useEffect(() => {
    const ids = allNavLinks.map((l) => l.id).filter((id) => id !== "home" && id !== "products");
    const sections = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) setActiveSection(visible[0].target.id);
        else if (window.scrollY < 200) setActiveSection("home");
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.1, 0.5, 1] },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [pathname]);

  // Escape to close, and lock body scroll while the drawer is open.
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setIsMobileMenuOpen(false);
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
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => e.matches && setIsMobileMenuOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        aria-label="Main"
        className="vr-dock fixed inset-x-0 top-4 z-50 mx-auto flex w-[min(1200px,calc(100%-2rem))] items-center justify-between rounded-[18px] py-2 pl-5 pr-2"
      >
        <Link to="/" className="flex items-center rounded-md focus-ring" aria-label="Tobiya Game Studio — home">
          <BrandLogo className="h-8 md:h-9" />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <li key={link.name}>
              <a
                href={link.href}
                data-active={current === link.id}
                aria-current={current === link.id ? "true" : undefined}
                className="vr-dock-link inline-flex min-h-[40px] items-center whitespace-nowrap rounded-[10px] px-4 text-sm text-muted-foreground transition-all focus-ring"
              >
                {link.name}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href="/#contact"
            className="vr-btn-prime hidden h-11 items-center rounded-xl px-5 text-sm font-semibold sm:inline-flex focus-ring"
          >
            Start a project →
          </a>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav"
            className="vr-btn-ghost inline-flex h-11 w-11 items-center justify-center rounded-xl lg:hidden focus-ring"
          >
            {isMobileMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </motion.nav>

      {/* Rendered as a sibling of the nav: framer-motion transforms the nav, and a
          transformed ancestor would become the containing block for this fixed panel. */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="vr-dock fixed inset-x-4 top-[84px] z-40 max-h-[calc(100svh-100px)] overflow-y-auto rounded-2xl p-2 lg:hidden"
          >
            <nav aria-label="Mobile" className="flex flex-col">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-active={current === link.id}
                  aria-current={current === link.id ? "true" : undefined}
                  className={cn("vr-dock-link rounded-xl px-4 py-3.5 text-base font-medium text-foreground/90 focus-ring")}
                >
                  {link.name}
                </a>
              ))}
              <a
                href="/#contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="vr-btn-prime mt-2 inline-flex h-12 items-center justify-center rounded-xl text-base font-semibold focus-ring"
              >
                Start a project →
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
