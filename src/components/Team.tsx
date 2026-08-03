import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
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
import { supabase } from "@/integrations/supabase/client";
import { SectionHeader } from "./SectionHeader";
import { CardSkeleton, LoadingAnnouncer, SectionNotice } from "./CardSkeleton";

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

const getSocialLinks = (member: TeamMember): SocialLink[] => {
  if (!member.social_links) return [];

  if (typeof member.social_links === "string") {
    try {
      return JSON.parse(member.social_links);
    } catch {
      return [];
    }
  }

  return Array.isArray(member.social_links) ? (member.social_links as SocialLink[]) : [];
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 3);

export default function Team() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { data, error } = await supabase
          .from("team_members")
          .select("*")
          .order("display_order", { ascending: true });

        if (error) throw error;
        setTeam((data ?? []) as TeamMember[]);
      } catch (error) {
        console.error("Failed to load team members:", error);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, []);

  return (
    <section
      id="team"
      aria-labelledby="team-heading"
      className="section-padding relative bg-secondary/30"
    >
      <div className="absolute inset-0 grid-overlay opacity-20" />

      <div className="container mx-auto px-4 relative">
        <SectionHeader
          id="team-heading"
          eyebrow="The Team"
          title={
            <>
              Meet Our <span className="gradient-text">Talented Team</span>
            </>
          }
          description="Our team is diverse, with experience from a variety of backgrounds in gaming, music, and technology, including developers, artists, designers, and storytellers."
        />

        {loading && (
          <>
            <LoadingAnnouncer label="Loading team members" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </>
        )}

        {!loading && loadError && (
          <SectionNotice
            title="Team profiles are unavailable right now"
            description="Please refresh the page to try again."
          />
        )}

        {!loading && !loadError && team.length > 0 && (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {team.map((member, index) => {
              const socialLinks = getSocialLinks(member);
              const fallbackLinkedIn =
                socialLinks.length === 0 && member.linkedin_url
                  ? [{ platform: "LinkedIn", url: member.linkedin_url, icon: "Linkedin" }]
                  : [];
              const links = [...socialLinks, ...fallbackLinkedIn];

              return (
                <motion.li
                  key={member.id}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.45, delay: Math.min(0.08 * index, 0.3) }}
                  className="glass-card flex flex-col overflow-hidden group team-card"
                >
                  <div className="relative aspect-[4/3] sm:aspect-[4/5] overflow-hidden">
                    {member.photo_url ? (
                      <img
                        src={member.photo_url}
                        alt={`Portrait of ${member.name}`}
                        width={600}
                        height={750}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary to-accent/10 flex items-center justify-center">
                        <span className="text-4xl sm:text-5xl font-display text-primary/50" aria-hidden="true">
                          {getInitials(member.name)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-4 sm:p-6 text-center">
                    {/* Two-line clamp rather than truncate, so longer names stay readable */}
                    <h3 className="font-display text-base sm:text-lg font-bold mb-1 line-clamp-2 transition-colors group-hover:text-primary">
                      {member.name}
                    </h3>
                    <p className="text-sm text-primary mb-3">{member.role}</p>

                    {member.bio && (
                      <p className="text-sm text-muted-foreground text-pretty">{member.bio}</p>
                    )}

                    {/* Always visible: these were previously hover-only and
                        `hidden sm:flex`, so they were unreachable on mobile and
                        invisible to keyboard users. */}
                    {links.length > 0 && (
                      <ul className="mt-auto flex items-center justify-center gap-2 pt-4">
                        {links.map((link, i) => {
                          const IconComponent = ICON_MAP[link.icon] || LinkIcon;
                          return (
                            <li key={`${link.platform}-${i}`}>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`${member.name} on ${link.platform}`}
                                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-ring"
                              >
                                <IconComponent className="w-4 h-4" />
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mt-14"
        >
          <p className="text-muted-foreground mb-3">
            Interested in joining our team? We're always looking for talented individuals.
          </p>
          <a
            href="#contact"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md px-3 font-medium text-primary hover:underline focus-ring"
          >
            Get in touch with us
            <span aria-hidden="true">→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
