import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { ExternalLink, Play, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ProjectDetailDialog from "./ProjectDetailDialog";

interface Project {
  id: string;
  title: string;
  slug: string;
  category: string;
  short_description: string | null;
  full_description?: string | null;
  cover_image_url: string | null;
  gallery_images?: string[] | null;
  video_url: string | null;
  tools_used: string[] | null;
  project_link: string | null;
  featured: boolean | null;
}

const categories = [
  { id: "all", label: "All" },
  { id: "vr", label: "VR Projects" },
  { id: "ar", label: "AR Projects" },
  { id: "interactive", label: "Interactive" },
  { id: "award", label: "Awards" },
];

// Default projects data for initial display
const defaultProjects: Project[] = [
  {
    id: "1",
    title: "VR Educational Game for Co(X)ist",
    slug: "vr-educational-coexist",
    category: "vr",
    short_description: "An immersive VR educational experience designed to teach complex concepts through interactive gameplay.",
    cover_image_url: "https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=800",
    video_url: null,
    tools_used: ["Unity", "Oculus SDK", "Blender"],
    project_link: null,
    featured: true,
  },
  {
    id: "2",
    title: "Immersive Concert VR",
    slug: "immersive-concert-vr",
    category: "vr",
    short_description: "A groundbreaking VR concert experience that brings live performances to users anywhere in the world.",
    cover_image_url: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800",
    video_url: null,
    tools_used: ["Unity", "VR Audio", "Motion Capture"],
    project_link: null,
    featured: true,
  },
  {
    id: "3",
    title: "VR Tour Guide AI - Ethiopian",
    slug: "vr-tour-guide-ai",
    category: "vr",
    short_description: "AI-powered virtual tour guide showcasing Ethiopian cultural heritage and historical sites.",
    cover_image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    video_url: null,
    tools_used: ["Unity", "OpenAI", "WebXR"],
    project_link: null,
    featured: true,
  },
  {
    id: "4",
    title: "Educational AR Game",
    slug: "educational-ar-game",
    category: "ar",
    short_description: "Augmented reality educational game that brings learning to life through interactive 3D models.",
    cover_image_url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
    video_url: null,
    tools_used: ["Unity", "ARCore", "ARKit"],
    project_link: null,
    featured: false,
  },
  {
    id: "5",
    title: "Interactive Floor - Techno",
    slug: "interactive-floor-techno",
    category: "interactive",
    short_description: "Interactive floor installation for Techno events, creating immersive visual experiences.",
    cover_image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    video_url: null,
    tools_used: ["Unity", "Kinect", "Projection Mapping"],
    project_link: null,
    featured: false,
  },
  {
    id: "6",
    title: "Wall Game for Heineken",
    slug: "wall-game-heineken",
    category: "interactive",
    short_description: "Interactive wall game installation for Heineken brand activation events.",
    cover_image_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800",
    video_url: null,
    tools_used: ["Unity", "Touch Sensors", "LED Display"],
    project_link: null,
    featured: false,
  },
  {
    id: "7",
    title: "1st Place - Cyber Game Jam",
    slug: "cyber-game-jam-winner",
    category: "award",
    short_description: "Won first place at the Cyber Game Jam competition with our innovative VR game concept.",
    cover_image_url: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800",
    video_url: null,
    tools_used: null,
    project_link: null,
    featured: true,
  },
  {
    id: "8",
    title: "3rd Place - Fak'ugesi Festival",
    slug: "fakugesi-festival-award",
    category: "award",
    short_description: "Earned 3rd place and 'Rising Star' title in XR category at Fak'ugesi Festival, South Africa.",
    cover_image_url: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800",
    video_url: null,
    tools_used: null,
    project_link: null,
    featured: true,
  },
];

export default function Portfolio() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeCategory, setActiveCategory] = useState("all");
  const [projects, setProjects] = useState<Project[]>(defaultProjects);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        setProjects(data);
      }
    } catch (error) {
      console.log("Using default projects");
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = activeCategory === "all"
    ? projects
    : projects.filter((p) => p.category === activeCategory);

  return (
    <section id="works" className="section-padding relative" ref={ref}>
      {/* Background */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20 mb-4">
            Portfolio
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
            Our <span className="gradient-text">Works</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Explore our portfolio of VR, AR, and interactive experiences that push the boundaries of what's possible.
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === category.id
                  ? "bg-primary text-primary-foreground glow-primary"
                  : "bg-card border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {category.label}
            </button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="glass-card overflow-hidden group project-card"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                {project.cover_image_url ? (
                  <img
                    src={project.cover_image_url}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                    <span className="text-2xl font-display text-primary/50">{project.title[0]}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                
                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <span className={`category-pill ${project.category}`}>
                    {project.category}
                  </span>
                </div>

                {/* Play Button for Video */}
                {project.video_url && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-primary-foreground ml-1" />
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="font-display text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                  {project.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {project.short_description}
                </p>

                {/* Tools */}
                {project.tools_used && project.tools_used.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tools_used.slice(0, 3).map((tool) => (
                      <span
                        key={tool}
                        className="px-2 py-1 rounded text-xs bg-muted text-muted-foreground"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                )}

                {/* View More Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedProject(project);
                    setDialogOpen(true);
                  }}
                  className="w-full mt-2"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View More
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Project Detail Dialog */}
      <ProjectDetailDialog
        project={selectedProject}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </section>
  );
}
