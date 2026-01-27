import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Gamepad2, Glasses, Lightbulb, Sparkles } from "lucide-react";

const services = [
  {
    icon: Gamepad2,
    title: "Game Development",
    description: "We craft engaging games across multiple platforms, from mobile to console. Our team brings ideas to life with stunning visuals, compelling narratives, and addictive gameplay mechanics.",
    features: ["Cross-platform development", "2D & 3D games", "Mobile & console"],
  },
  {
    icon: Glasses,
    title: "AR/VR Application Development",
    description: "Immersive AR and VR applications that transport users to new realities. We specialize in creating experiences for training, education, entertainment, and enterprise solutions.",
    features: ["Virtual Reality", "Augmented Reality", "Mixed Reality"],
  },
  {
    icon: Lightbulb,
    title: "Prototyping & Concept VR",
    description: "Rapid prototyping services to validate ideas and concepts before full development. We help visualize and test your vision in virtual space.",
    features: ["Rapid prototyping", "Concept validation", "Proof of concept"],
  },
  {
    icon: Sparkles,
    title: "Interactive Experience Design",
    description: "Creating memorable interactive installations and digital experiences for events, exhibitions, and brand activations that captivate and engage audiences.",
    features: ["Interactive installations", "Event experiences", "Digital activations"],
  },
];

export default function Services() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="services" className="section-padding relative bg-secondary/30" ref={ref}>
      {/* Background Pattern */}
      <div className="absolute inset-0 grid-overlay opacity-30" />
      
      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20 mb-4">
            What We Do
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
            Our <span className="gradient-text">Services</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            At Tobiya, we design and develop a wide range of interactive experiences, including virtual reality, augmented reality, and mixed reality applications.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 * index }}
              className="glass-card p-4 md:p-8 group hover:border-primary/50 transition-all duration-500 project-card"
            >
              <div className="flex items-start gap-4 md:gap-6">
                <div className="service-icon shrink-0 group-hover:scale-110 transition-transform duration-300 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center">
                  <service.icon className="w-6 h-6 md:w-8 md:h-8 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-lg md:text-xl font-bold mb-2 md:mb-3">{service.title}</h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4 leading-relaxed">{service.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {service.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-2 md:px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
