import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import tobiyaLogo from "@/assets/tobiya-logo-white.png";
const navLinks = [{
  name: "Home",
  href: "/"
}, {
  name: "About",
  href: "/#about"
}, {
  name: "Services",
  href: "/#services"
}, {
  name: "Works",
  href: "/#works"
}, {
  name: "Team",
  href: "/#team"
}, {
  name: "Contact",
  href: "/#contact"
}];
export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    if (href.startsWith("/#")) {
      const sectionId = href.replace("/#", "");
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth"
        });
      }
    }
  };
  return <motion.nav initial={{
    y: -100
  }} animate={{
    y: 0
  }} transition={{
    duration: 0.6,
    ease: "easeOut"
  }} className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-background/90 backdrop-blur-xl border-b border-border/50 shadow-lg" : "bg-transparent"}`}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src={tobiyaLogo} alt="Tobiya Studio" className="h-14 w-auto transition-transform duration-300 hover:scale-110 rounded-md" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => <a key={link.name} href={link.href} onClick={e => {
            if (link.href.startsWith("/#")) {
              e.preventDefault();
              handleNavClick(link.href);
            }
          }} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300 hover-underline">
                {link.name}
              </a>)}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-foreground" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && <motion.div initial={{
        opacity: 0,
        height: 0
      }} animate={{
        opacity: 1,
        height: "auto"
      }} exit={{
        opacity: 0,
        height: 0
      }} transition={{
        duration: 0.3
      }} className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border">
            <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
              {navLinks.map(link => <a key={link.name} href={link.href} onClick={e => {
            if (link.href.startsWith("/#")) {
              e.preventDefault();
              handleNavClick(link.href);
            }
          }} className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2">
                  {link.name}
                </a>)}
            </div>
          </motion.div>}
      </AnimatePresence>
    </motion.nav>;
}