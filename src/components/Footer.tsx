import { Link } from "react-router-dom";
import {
  Heart,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Github,
  Send,
  MessageCircle,
  Music,
  Globe,
  Mail,
  Link as LinkIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cms } from "@/integrations/cpanel/client";
import { BrandLogo } from "./BrandLogo";
import { useHiddenSections, type SectionId } from "@/lib/sections";

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

const footerLinks: Record<string, { name: string; href: string; section?: SectionId }[]> = {
  Company: [
    { name: "About Us", href: "/#about", section: "about" },
    { name: "Our Team", href: "/#team", section: "team" },
    { name: "Awards", href: "/#awards", section: "awards" },
  ],
  Services: [
    { name: "Game Development", href: "/#services" },
    { name: "AR/VR Apps", href: "/#services" },
    { name: "Interactive Design", href: "/#services" },
  ],
  Work: [
    { name: "All Projects", href: "/projects" },
    { name: "Products", href: "/products", section: "products" },
    { name: "Latest News", href: "/#blog", section: "blog" },
    { name: "Start a Project", href: "/#contact", section: "contact" },
  ],
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Github,
  Send,
  MessageCircle,
  Music,
  Globe,
  Mail,
  Link: LinkIcon,
  Palette: Globe,
};

export default function Footer() {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const { isHidden } = useHiddenSections();

  useEffect(() => {
    const fetchSocialLinks = async () => {
      const { data } = await cms
        .from("site_settings")
        .select("value")
        .eq("key", "social_links")
        .maybeSingle();

      if (!data?.value) return;

      try {
        setSocialLinks(JSON.parse(data.value));
      } catch {
        setSocialLinks([]);
      }
    };

    fetchSocialLinks();
  }, []);

  return (
    <footer className="relative mt-10 border-t border-border bg-background/50 pb-8 pt-14 backdrop-blur-md md:pt-16">
      <div className="container mx-auto px-5">
        {/* 2fr brand column with no max-width cap, so the grid does not leave
            a large dead gutter before the first link column. */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-12 mb-12">
          <div>
            <Link
              to="/"
              className="mb-4 inline-block rounded-md focus-ring"
              aria-label="Tobiya Game Studio — home"
            >
              {/* Theme-aware: this was previously hardcoded to the white mark,
                  which made it invisible on the light-mode surface. */}
              <BrandLogo className="h-10 md:h-12" />
            </Link>

            <p className="mb-4 max-w-md text-sm md:text-base text-muted-foreground text-pretty">
              We create interactive worlds that inspire exploration, foster connection, and redefine
              the boundaries of play.
            </p>

            <p className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>Built with</span>
              <Heart className="h-4 w-4 fill-destructive text-destructive" aria-hidden="true" />
              <span>in Ethiopia</span>
            </p>

            {socialLinks.length > 0 && (
              <ul className="flex items-center gap-2">
                {socialLinks.map((link, index) => {
                  const IconComponent = iconMap[link.icon] || LinkIcon;
                  return (
                    <li key={`${link.platform}-${index}`}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Tobiya Game Studio on ${link.platform}`}
                        className="vr-btn-ghost flex h-11 w-11 items-center justify-center rounded-xl text-primary transition-all duration-300 focus-ring"
                      >
                        <IconComponent className="h-5 w-5" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {Object.entries(footerLinks).map(([heading, links]) => (
            <nav key={heading} aria-labelledby={`footer-${heading.toLowerCase()}`}>
              <h2
                id={`footer-${heading.toLowerCase()}`}
                className="mono mb-4 text-primary"
              >
                {heading}
              </h2>
              <ul className="space-y-1">
                {links.filter((link) => !link.section || !isHidden(link.section)).map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="inline-flex min-h-[40px] items-center rounded text-muted-foreground transition-colors hover:text-primary focus-ring"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="mono text-muted-foreground">
            © {new Date().getFullYear()} Tobiya Game Studio — Beyond the screen
          </p>
          <p className="text-sm text-muted-foreground">
            <a
              href="mailto:contact@tobiyastudio.com"
              className="rounded transition-colors hover:text-primary focus-ring"
            >
              contact@tobiyastudio.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
