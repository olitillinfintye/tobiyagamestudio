import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Linkedin, Twitter, Facebook, Instagram, Youtube, Github, Send, MessageCircle, Music, Globe, Mail, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  social_links: unknown;
}

const ICON_MAP: Record<string, React.ElementType> = {
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
  Dribbble: Globe,
};

const defaultTeam: TeamMember[] = [
  {
    id: "1",
    name: "Oliyad Tesfaye",
    role: "CEO & XR Developer",
    bio: "Visionary leader driving innovation in XR technology in Ethiopia.",
    photo_url: null,
    linkedin_url: null,
    twitter_url: null,
    social_links: null,
  },
  {
    id: "2",
    name: "Yohannis Alemayehu",
    role: "Architect & AR Developer",
    bio: "Combining architectural expertise with cutting-edge AR development.",
    photo_url: null,
    linkedin_url: null,
    twitter_url: null,
    social_links: null,
  },
  {
    id: "3",
    name: "Same Samson",
    role: "Audio Engineer",
    bio: "Creating immersive soundscapes that elevate virtual experiences.",
    photo_url: null,
    linkedin_url: null,
    twitter_url: null,
    social_links: null,
  },
  {
    id: "4",
    name: "Yonas H/Michael",
    role: "Mechanical & UI/UX Designer",
    bio: "Blending mechanical engineering with intuitive user experience design.",
    photo_url: null,
    linkedin_url: null,
    twitter_url: null,
    social_links: null,
  },
  {
    id: "5",
    name: "Tsedeniya Abiy",
    role: "Architect & 3D Designer",
    bio: "Crafting stunning 3D environments and architectural visualizations.",
    photo_url: null,
    linkedin_url: null,
    twitter_url: null,
    social_links: null,
  },
  {
    id: "6",
    name: "Dagim Bekele",
    role: "Software Eng & Web Developer",
    bio: "Building robust software solutions and web platforms.",
    photo_url: null,
    linkedin_url: null,
    twitter_url: null,
    social_links: null,
  },
];

export default function Team() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [team, setTeam] = useState<TeamMember[]>(defaultTeam);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        setTeam(data as TeamMember[]);
      }
    } catch (error) {
      console.log("Using default team data");
    }
  };

  const getSocialLinks = (member: TeamMember): SocialLink[] => {
    if (!member.social_links) return [];
    if (typeof member.social_links === 'string') {
      try {
        return JSON.parse(member.social_links);
      } catch {
        return [];
      }
    }
    if (Array.isArray(member.social_links)) {
      return member.social_links as SocialLink[];
    }
    return [];
  };

  return (
    <section id="team" className="section-padding relative bg-secondary/30" ref={ref}>
      <div className="absolute inset-0 grid-overlay opacity-20" />
      
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20 mb-4">
            The Team
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
            Meet Our <span className="gradient-text">Talented Team</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Our team is diverse, with experience from a variety of backgrounds in gaming, music, and technology, including developers, artists, designers, and storytellers.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {team.map((member, index) => {
            const socialLinks = getSocialLinks(member);
            const hasAnySocialLink = socialLinks.length > 0 || member.linkedin_url;
            
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="glass-card overflow-hidden group team-card"
              >
                <div className="relative h-40 sm:h-64 overflow-hidden">
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary to-accent/10 flex items-center justify-center">
                      <span className="text-3xl sm:text-5xl font-display text-primary/50">
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {hasAnySocialLink && (
                    <div className="hidden sm:flex absolute bottom-4 left-0 right-0 justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                      {socialLinks.map((link, i) => {
                        const IconComponent = ICON_MAP[link.icon] || LinkIcon;
                        return (
                          <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-full bg-card/90 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                            title={link.platform}
                          >
                            <IconComponent className="w-4 h-4" />
                          </a>
                        );
                      })}
                      {socialLinks.length === 0 && member.linkedin_url && (
                        <a
                          href={member.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-full bg-card/90 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-6 text-center">
                  <h3 className="font-display text-base sm:text-xl font-bold mb-1 group-hover:text-primary transition-colors truncate">
                    {member.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-primary mb-2 sm:mb-3 truncate">{member.role}</p>
                  {member.bio && (
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-none">{member.bio}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground mb-4">
            Interested in joining our team? We're always looking for talented individuals.
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
          >
            Get in touch with us →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
