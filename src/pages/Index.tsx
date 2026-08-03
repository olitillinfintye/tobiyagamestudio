import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Partners from "@/components/Partners";
import Services from "@/components/Services";
import Portfolio from "@/components/Portfolio";
import Team from "@/components/Team";
import Awards from "@/components/Awards";
import Blog from "@/components/Blog";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
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
        <About />
        <Partners />
        <Services />
        <Portfolio />
        <Team />
        <Awards />
        <Blog />
        <Contact />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
