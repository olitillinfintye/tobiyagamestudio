import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";
import { lazy, Suspense } from "react";
import { SpatialBackground } from "@/components/SpatialBackground";

/** The ambient VR world sits behind every public page, but not the admin. */
function PublicBackdrop() {
  const { pathname } = useLocation();
  return pathname.startsWith("/admin") ? null : <SpatialBackground />;
}

const Index = lazy(() => import("./pages/Index"));
const Admin = lazy(() => import("./pages/Admin"));
const BlogPostPage = lazy(() => import("./pages/BlogPost"));
const ProductsPage = lazy(() => import("./pages/Products"));
const ProjectsPage = lazy(() => import("./pages/Projects"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* The VR design is dark-only, so the theme is fixed rather than following the OS. */}
    <ThemeProvider attribute="class" forcedTheme="dark" defaultTheme="dark" disableTransitionOnChange>
      {/* Opts every framer-motion animation out when the OS requests reduced motion */}
      <MotionConfig reducedMotion="user">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <PublicBackdrop />
            <Suspense fallback={<div className="min-h-screen" />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:slug" element={<ProductDetailPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </MotionConfig>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
