import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cms } from "@/integrations/cpanel/client";
import * as LucideIcons from "lucide-react";
import { SectionHeader } from "./SectionHeader";

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  display_order: number;
}

// Rendered until the CMS responds, so the section is never empty on first paint.
const fallbackServices: Service[] = [
  {
    id: "1",
    icon: "Gamepad2",
    title: "Game Development",
    description:
      "We craft engaging games across multiple platforms, from mobile to console. Our team brings ideas to life with stunning visuals, compelling narratives, and addictive gameplay mechanics.",
    features: ["Cross-platform development", "2D & 3D games", "Mobile & console"],
    display_order: 1,
  },
  {
    id: "2",
    icon: "Glasses",
    title: "AR/VR Application Development",
    description:
      "Immersive AR and VR applications that transport users to new realities. We specialize in creating experiences for training, education, entertainment, and enterprise solutions.",
    features: ["Virtual Reality", "Augmented Reality", "Mixed Reality"],
    display_order: 2,
  },
  {
    id: "3",
    icon: "Lightbulb",
    title: "Prototyping & Concept VR",
    description:
      "Rapid prototyping services to validate ideas and concepts before full development. We help visualize and test your vision in virtual space.",
    features: ["Rapid prototyping", "Concept validation", "Proof of concept"],
    display_order: 3,
  },
  {
    id: "4",
    icon: "Sparkles",
    title: "Interactive Experience Design",
    description:
      "Creating memorable interactive installations and digital experiences for events, exhibitions, and brand activations that captivate and engage audiences.",
    features: ["Interactive installations", "Event experiences", "Digital activations"],
    display_order: 4,
  },
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Gamepad2: LucideIcons.Gamepad2,
  Glasses: LucideIcons.Glasses,
  Lightbulb: LucideIcons.Lightbulb,
  Sparkles: LucideIcons.Sparkles,
  Monitor: LucideIcons.Monitor,
  Smartphone: LucideIcons.Smartphone,
  Globe: LucideIcons.Globe,
  Cpu: LucideIcons.Cpu,
  Code: LucideIcons.Code,
  Palette: LucideIcons.Palette,
  Video: LucideIcons.Video,
  Headphones: LucideIcons.Headphones,
  Zap: LucideIcons.Zap,
  Rocket: LucideIcons.Rocket,
  Target: LucideIcons.Target,
};

const getIconComponent = (iconName: string) => iconMap[iconName] || LucideIcons.Sparkles;

export default function Services() {
  const [services, setServices] = useState<Service[]>(fallbackServices);

  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await cms
        .from("services")
        .select("*")
        .order("display_order", { ascending: true });

      if (!error && data && data.length > 0) setServices(data);
    };

    fetchServices();
  }, []);

  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="section-padding relative bg-secondary/30"
    >
      <div className="absolute inset-0 grid-overlay opacity-30" />

      <div className="container mx-auto px-4 relative">
        <SectionHeader
          id="services-heading"
          eyebrow="What We Do"
          title={
            <>
              Our <span className="gradient-text">Services</span>
            </>
          }
          description="At Tobiya, we design and develop a wide range of interactive experiences, including virtual reality, augmented reality, and mixed reality applications."
        />

        <ul className="grid md:grid-cols-2 gap-5 md:gap-8">
          {services.map((service, index) => {
            const IconComponent = getIconComponent(service.icon);

            return (
              <motion.li
                key={service.id}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="glass-card p-5 md:p-8 group hover:border-primary/50 transition-all duration-500 project-card"
              >
                <div className="flex items-start gap-4 md:gap-6 h-full">
                  <div className="service-icon shrink-0 w-12 h-12 md:w-14 md:h-14 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-6 h-6 md:w-7 md:h-7 text-primary-foreground" />
                  </div>

                  {/* flex column + mt-auto pins the feature pills to the card
                      bottom so they align across a row of uneven descriptions */}
                  <div className="min-w-0 flex flex-col h-full">
                    <h3 className="font-display text-display-sm font-bold mb-2 md:mb-3">
                      {service.title}
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground mb-4 leading-relaxed text-pretty">
                      {service.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-auto pt-1">
                      {service.features?.map((feature) => (
                        <span
                          key={feature}
                          className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
