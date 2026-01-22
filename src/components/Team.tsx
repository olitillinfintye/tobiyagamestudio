import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Linkedin, Twitter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
}

const defaultTeam: TeamMember[] = [
  {
    id: "1",
    name: "Oliyad Tesfaye",
    role: "CEO & XR Developer",
    bio: "Visionary leader driving innovation in XR technology in Ethiopia.",
    photo_url: null,
  },
  {
    id: "2",
    name: "Yohannis Alemayehu",
    role: "Architect & AR Developer",
    bio: "Combining architectural expertise with cutting-edge AR development.",
    photo_url: null,
  },
  {
    id: "3",
    name: "Same Samson",
    role: "Audio Engineer",
    bio: "Creating immersive soundscapes that elevate virtual experiences.",
    photo_url: null,
  },
  {
    id: "4",
    name: "Yonas H/Michael",
    role: "Mechanical & UI/UX Designer",
    bio: "Blending mechanical engineering with intuitive user experience design.",
    photo_url: null,
  },
  {
    id: "5",
    name: "Tsedeniya Abiy",
    role: "Architect & 3D Designer",
    bio: "Crafting stunning 3D environments and architectural visualizations.",
    photo_url: null,
  },
  {
    id: "6",
    name: "Dagim Bekele",
    role: "Software Eng & Web Developer",
    bio: "Building robust software solutions and web platforms.",
    photo_url: null,
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
        setTeam(data);
      }
    } catch (error) {
      console.log("Using default team data");
    }
  };

  return (
    <section id="team" className="section-padding relative bg-secondary/30" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 grid-overlay opacity-20" />
      
      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
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

        {/* Team Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="glass-card overflow-hidden group team-card"
            >
              {/* Photo */}
              <div className="relative h-64 overflow-hidden">
                {member.photo_url ? (
                  <img
                    src={member.photo_url}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary to-accent/10 flex items-center justify-center">
                    <span className="text-5xl font-display text-primary/50">
                      {member.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Social Links - Show on hover */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full bg-card/90 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full bg-card/90 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* Info */}
              <div className="p-6 text-center">
                <h3 className="font-display text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                  {member.name}
                </h3>
                <p className="text-sm text-primary mb-3">{member.role}</p>
                {member.bio && (
                  <p className="text-sm text-muted-foreground">{member.bio}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Join Us CTA */}
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
