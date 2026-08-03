import { motion } from "framer-motion";
import { Target, Eye, Lightbulb, Users } from "lucide-react";
import { SectionHeader } from "./SectionHeader";

const objectives = [
  {
    icon: Lightbulb,
    title: "Innovate in XR Technology",
    description:
      "Continuously explore and integrate the latest advancements in extended reality to enhance the quality and interactivity of our games and experiences.",
  },
  {
    icon: Target,
    title: "Create Engaging Experiences",
    description:
      "Develop immersive games and interactive applications that involve players in emotional contacts, fostering a sense of exploration in detailed, virtual worlds.",
  },
  {
    icon: Users,
    title: "Nurture Collaboration",
    description:
      "Nurture a dynamic community of creators and players by providing platforms that will help in collaboration, feedback, and shared experiences.",
  },
  {
    icon: Eye,
    title: "Promote Education",
    description:
      "Utilize our interactive experiences to teach and inform audiences about diverse cultures, technologies, and artistic expressions.",
  },
];

const pillars = [
  {
    icon: Target,
    title: "Our Mission",
    body: "Our mission at Tobiya Game Studio is to harness the potential of extended reality (XR) to create immersive, interactive experiences that engage, educate, and inspire. We strive to push the boundaries of storytelling through innovative game design, fostering meaningful connections between players and the digital worlds we build.",
  },
  {
    icon: Eye,
    title: "Our Vision",
    body: "We strongly believe in the power of immersive storytelling to inspire and educate. Our vision includes the development of interactive experiences that not only entertain but also challenge perceptions and foster exploration. Using the latest in XR technology, we strive to break down the barriers between the digital and physical worlds.",
  },
];

export default function About() {
  return (
    <section id="about" aria-labelledby="about-heading" className="section-padding relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4">
        <SectionHeader
          id="about-heading"
          eyebrow="About Us"
          title={
            <>
              <span className="gradient-text">XR Innovation</span> in Ethiopia
            </>
          }
          description="Tobiya Game Studio is an innovator in game development, with a high focus on extended reality (XR) and interactive experiences. Started by a team of passionate creators and technologists, the studio aims to push the boundaries of storytelling and engagement through immersive technologies in Ethiopia."
        />

        {/* Mission & Vision — both use the primary tone; the previous gold/teal
            split assigned brand colour arbitrarily rather than semantically. */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-16 md:mb-20">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.15 * index }}
              className="glass-card p-6 md:p-8 relative overflow-hidden group hover:border-primary/50 transition-colors"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center mb-6">
                  <pillar.icon className="w-7 h-7 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-display text-display-md font-bold mb-4">{pillar.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-pretty">{pillar.body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Objectives */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="font-display text-display-md font-bold text-center mb-10">Our Objectives</h3>

          <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {objectives.map((objective, index) => (
              <motion.li
                key={objective.title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="glass-card flex flex-col p-6 text-center group hover:border-primary/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <objective.icon className="w-6 h-6 text-primary" aria-hidden="true" />
                </div>
                {/* min-h keeps the body copy on a shared baseline when a title wraps */}
                <h4 className="text-base font-semibold mb-2 sm:min-h-[3rem] flex items-center justify-center text-balance">
                  {objective.title}
                </h4>
                <p className="text-sm text-muted-foreground text-pretty">{objective.description}</p>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
