import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cms } from "@/integrations/cpanel/client";
import * as LucideIcons from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { useTilt } from "@/hooks/useTilt";

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
  const tilt = useTilt();

  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await cms.from("services").select("*").order("display_order", { ascending: true });
      if (!error && data && data.length > 0) setServices(data);
    };
    fetchServices();
  }, []);

  return (
    <section id="services" aria-labelledby="services-heading" className="section-padding relative">
      <div className="container mx-auto px-5">
        <SectionHeader
          id="services-heading"
          eyebrow="Capabilities"
          title={
            <>
              Built for every
              <br />
              <span className="gradient-text">reality.</span>
            </>
          }
          description="From the first prototype to launch, we design, build and ship experiences that people step into — not just look at."
        />

        <ul className={`grid gap-[18px] sm:grid-cols-2 ${services.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          {services.map((service, index) => {
            const IconComponent = getIconComponent(service.icon);
            return (
              <motion.li
                key={service.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, delay: (index % 4) * 0.08, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <article {...tilt} className="vr-card flex h-full min-h-[300px] flex-col justify-between gap-8 p-7">
                  <span className="mono absolute right-6 top-6 text-[#3b4766]" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="vr-icon">
                    <IconComponent className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="mb-2.5 text-2xl font-semibold leading-tight">{service.title}</h3>
                    <p className="text-[14.5px] leading-relaxed text-muted-foreground text-pretty">{service.description}</p>
                    {service.features?.length > 0 && (
                      <ul className="mt-4 flex flex-wrap gap-1.5">
                        {service.features.map((feature) => (
                          <li key={feature} className="mono rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] text-primary">
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}