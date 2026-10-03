import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import { DisciplineMarquee } from "@/components/DisciplineMarquee";
import About from "@/components/About";
import Partners from "@/components/Partners";
import Services from "@/components/Services";
import Portfolio from "@/components/Portfolio";
import Team from "@/components/Team";
import Awards from "@/components/Awards";
import Blog from "@/components/Blog";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { useHiddenSections } from "@/lib/sections";

const Index = () => {
  // Sections render only once visibility is known, so hidden ones never flash in.
  const { ready, isHidden } = useHiddenSections();
  const show = (id: Parameters<typeof isHidden>[0]) => ready && !isHidden(id);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* First focusable element on the page, for keyboard and screen-reader users */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:font-medium focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      <header>
        <Navbar />
      </header>

      <main id="main">
        <Hero />
        <DisciplineMarquee />
        {show("partners") && <Partners />}
        {show("about") && <About showObjectives={!isHidden("objectives")} />}
        {show("services") && <Services />}
        {show("works") && <Portfolio />}
        {show("team") && <Team />}
        {show("awards") && <Awards />}
        {show("blog") && <Blog />}
        {show("contact") && <Contact />}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
