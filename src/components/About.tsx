import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Target, Eye, Lightbulb, Users } from "lucide-react";
const objectives = [{
  icon: Lightbulb,
  title: "Innovate in XR Technology",
  description: "Continuously explore and integrate the latest advancements in extended reality to enhance the quality and interactivity of our games and experiences."
}, {
  icon: Target,
  title: "Create Engaging Experiences",
  description: "Develop immersive games and interactive applications that involve players in emotional contacts, fostering a sense of exploration in detailed, virtual worlds."
}, {
  icon: Users,
  title: "Nurture Collaboration",
  description: "Nurture a dynamic community of creators and players by providing platforms that will help in collaboration, feedback, and shared experiences."
}, {
  icon: Eye,
  title: "Promote Education",
  description: "Utilize our interactive experiences to teach and inform audiences about diverse cultures, technologies, and artistic expressions."
}];
export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: "-100px"
  });
  return <section id="about" className="section-padding relative overflow-hidden" ref={ref}>
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div initial={{
        opacity: 0,
        y: 40
      }} animate={isInView ? {
        opacity: 1,
        y: 0
      } : {}} transition={{
        duration: 0.6
      }} className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20 mb-4">
            About Us
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">XR Innovation in Ethiopia<span className="gradient-text">XR Innovation</span> in Ethiopia
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
            Tobiya Game Studio is an innovator in game development, with a high focus on extended reality (XR) and interactive experiences. Started by a team of passionate creators and technologists, the studio aims to push the boundaries of storytelling and engagement through immersive technologies in Ethiopia.
          </p>
        </motion.div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <motion.div initial={{
          opacity: 0,
          x: -40
        }} animate={isInView ? {
          opacity: 1,
          x: 0
        } : {}} transition={{
          duration: 0.6,
          delay: 0.2
        }} className="glass-card p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-4">Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our mission at Tobiya Game Studio is to harness the potential of extended reality (XR) to create immersive, interactive experiences that engage, educate, and inspire. We strive to push the boundaries of storytelling through innovative game design, fostering meaningful connections between players and the digital worlds we build.
              </p>
            </div>
          </motion.div>

          <motion.div initial={{
          opacity: 0,
          x: 40
        }} animate={isInView ? {
          opacity: 1,
          x: 0
        } : {}} transition={{
          duration: 0.6,
          delay: 0.4
        }} className="glass-card p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl group-hover:bg-accent/20 transition-colors" />
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                <Eye className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-4">Our Vision</h3>
              <p className="text-muted-foreground leading-relaxed">
                We strongly believe in the power of immersive storytelling to inspire and educate. Our vision includes the development of interactive experiences that not only entertain but also challenge perceptions and foster exploration. Using the latest in XR technology, we strive to break down the barriers between the digital and physical worlds.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Objectives */}
        <motion.div initial={{
        opacity: 0,
        y: 40
      }} animate={isInView ? {
        opacity: 1,
        y: 0
      } : {}} transition={{
        duration: 0.6,
        delay: 0.6
      }}>
          <h3 className="font-display text-2xl font-bold text-center mb-10">Our Objectives</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {objectives.map((objective, index) => <motion.div key={objective.title} initial={{
            opacity: 0,
            y: 40
          }} animate={isInView ? {
            opacity: 1,
            y: 0
          } : {}} transition={{
            duration: 0.6,
            delay: 0.2 * index
          }} className="glass-card p-6 text-center group hover:border-primary/50 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <objective.icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-display text-lg font-semibold mb-2">{objective.title}</h4>
                <p className="text-sm text-muted-foreground">{objective.description}</p>
              </motion.div>)}
          </div>
        </motion.div>
      </div>
    </section>;
}