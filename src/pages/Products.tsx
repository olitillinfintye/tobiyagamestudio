import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Package, Play } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Skeleton } from "@/components/ui/skeleton";
import { cms } from "@/integrations/cpanel/client";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/products";
import { useHiddenSections } from "@/lib/sections";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState<string>("All");
  const { ready, isHidden } = useHiddenSections();

  useEffect(() => {
    document.title = "Products — Tobiya Game Studio";
    cms
      .from("products")
      .select("*")
      .eq("status", "published")
      .order("display_order")
      .then(({ data }) => {
        setProducts(data ?? []);
        setLoading(false);
      });
  }, []);

  const platforms = useMemo(
    () => ["All", ...Array.from(new Set(products.flatMap((p) => p.platforms ?? [])))],
    [products],
  );
  const filtered = platform === "All" ? products : products.filter((p) => p.platforms?.includes(platform));
  const featured = platform === "All" ? filtered.find((p) => p.featured) : undefined;
  const rest = featured ? filtered.filter((p) => p.id !== featured.id) : filtered;

  if (ready && isHidden("products")) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header>
        <Navbar />
      </header>

      <main id="main" className="pt-28 pb-20">
        <section className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mb-10 md:mb-14">
            <Eyebrow className="mb-4">Our Products</Eyebrow>
            <h1 className="font-display text-display-lg font-bold mb-4 text-balance">
              Games &amp; apps you can <span className="gradient-text">play today</span>
            </h1>
            <p className="text-body-lg text-muted-foreground text-pretty">
              Immersive experiences built by Tobiya Game Studio — available across VR headsets, PC and mobile.
            </p>
          </div>

          {platforms.length > 2 && (
            <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filter by platform">
              {platforms.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={platform === p}
                  onClick={() => setPlatform(p)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition-colors focus-ring",
                    platform === p
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/60 hover:text-foreground",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
              <p className="text-lg font-medium">New products are coming soon.</p>
              <p className="text-muted-foreground">Check back shortly or follow us for launch news.</p>
            </div>
          ) : (
            <>
              {featured && <FeaturedCard product={featured} />}
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((product, i) => (
                  <motion.li
                    key={product.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                  >
                    <ProductCard product={product} />
                  </motion.li>
                ))}
              </ul>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Platforms({ product, className }: { product: Product; className?: string }) {
  if (!product.platforms?.length) return null;
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)} aria-label="Platforms">
      {product.platforms.map((p) => (
        <li key={p} className="rounded-full bg-background/70 backdrop-blur px-2.5 py-1 text-xs font-medium border border-border/60">
          {p}
        </li>
      ))}
    </ul>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to={`/products/${product.slug}`}
      className="group glass-card block h-full overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 focus-ring"
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        {product.cover_image_url && (
          <img
            src={product.cover_image_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        {product.trailer_url && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 text-xs backdrop-blur">
            <Play className="w-3 h-3" aria-hidden="true" /> Trailer
          </span>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-xl font-bold">{product.title}</h2>
          <ArrowUpRight className="w-5 h-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
        </div>
        {product.tagline && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{product.tagline}</p>}
        <Platforms product={product} className="mt-4" />
      </div>
    </Link>
  );
}

function FeaturedCard({ product }: { product: Product }) {
  return (
    <Link
      to={`/products/${product.slug}`}
      className="group relative mb-8 block overflow-hidden rounded-3xl border border-border/60 focus-ring"
    >
      <div className="aspect-[16/10] sm:aspect-[21/9] bg-muted">
        {product.cover_image_url && (
          <img
            src={product.cover_image_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 md:p-10">
        <span className="mb-3 inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">Featured</span>
        <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold">{product.title}</h2>
        {product.tagline && <p className="mt-2 max-w-2xl text-muted-foreground sm:text-lg">{product.tagline}</p>}
        <Platforms product={product} className="mt-4" />
      </div>
    </Link>
  );
}
