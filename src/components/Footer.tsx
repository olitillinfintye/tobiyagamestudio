import { Link } from "react-router-dom";
import { Heart, Linkedin, Twitter, Facebook, Instagram, Youtube, Github, Send, MessageCircle, Music, Globe, Mail, Link as LinkIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import tobiyaLogo from "@/assets/tobiya-logo-white.png";

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

const footerLinks = {
  company: [
    { name: "About Us", href: "/#about" },
    { name: "Our Team", href: "/#team" },
    { name: "Careers", href: "/#contact" },
  ],
  services: [
    { name: "Game Development", href: "/#services" },
    { name: "AR/VR Apps", href: "/#services" },
    { name: "Interactive Design", href: "/#services" },
  ],
  portfolio: [
    { name: "VR Projects", href: "/#works" },
    { name: "AR Projects", href: "/#works" },
    { name: "Awards", href: "/#works" },
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
  Palette: Globe, // Fallback for Behance
};

export default function Footer() {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    const fetchSocialLinks = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "social_links")
        .maybeSingle();
      
      if (data?.value) {
        try {
          setSocialLinks(JSON.parse(data.value));
        } catch {
          setSocialLinks([]);
        }
      }
    };
    fetchSocialLinks();
  }, []);

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    if (href.startsWith("/#")) {
      e.preventDefault();
      const sectionId = href.replace("/#", "");
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const renderSocialIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || LinkIcon;
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <footer className="bg-card border-t border-border/50 pt-12 md:pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12 mb-8 md:mb-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <img src={tobiyaLogo} alt="Tobiya Studio" className="h-16 md:h-20 w-auto" />
            </Link>
            <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6 max-w-sm">
              We create interactive worlds that inspire exploration, foster connection, and redefine the boundaries of play.
            </p>
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-4">
              <span>Built with</span>
              <Heart className="w-3 h-3 md:w-4 md:h-4 text-destructive fill-destructive" />
              <span>in Ethiopia</span>
            </div>
            
            {/* Social Media Icons */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3">
                {socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                    aria-label={link.platform}
                  >
                    {renderSocialIcon(link.icon)}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-display font-bold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => handleNavClick(link.href, e)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div>
            <h4 className="font-display font-bold mb-4">Services</h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => handleNavClick(link.href, e)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Portfolio Links */}
          <div>
            <h4 className="font-display font-bold mb-4">Portfolio</h4>
            <ul className="space-y-3">
              {footerLinks.portfolio.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => handleNavClick(link.href, e)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Tobiya Game Studio. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
