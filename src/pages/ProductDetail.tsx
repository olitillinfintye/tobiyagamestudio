import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Share2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cms } from "@/integrations/cpanel/client";
import { getEmbedUrl, storeLabel, type Product } from "@/lib/products";
import { useHiddenSections } from "@/lib/sections";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const { ready, isHidden } = useHiddenSections();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    cms
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle()
      .then(({ data }) => {
        setProduct(data ?? null);
        setLoading(false);
        if (data) document.title = `${data.title} — Tobiya Game Studio`;
      });
  }, [slug]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: product?.title, text: product?.tagline ?? undefined, url });
      else throw new Error();
    } catch {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  if (ready && isHidden("products")) return <Navigate to="/" replace />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-4xl font-bold mb-4">Product not found</h1>
          <p className="text-muted-foreground mb-8">This product doesn't exist or isn't available yet.</p>
          <Button asChild>
            <Link to="/products">
              <ArrowLeft className="w-4 h-4 mr-2" /> All products
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const trailer = product.trailer_url ? getEmbedUrl(product.trailer_url) : null;

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header>
        <Navbar />
      </header>

      <main id="main" className="pt-24 pb-20">
        {/* Hero */}
        <section className="relative">
          {product.cover_image_url && (
            <div className="absolute inset-x-0 top-0 h-[60vh] overflow-hidden pointer-events-none" aria-hidden="true">
              <img src={product.cover_image_url} alt="" className="h-full w-full object-cover scale-110 blur-2xl opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-b from-background/40 to-background" />
            </div>
          )}

          <div className="relative container mx-auto px-4 sm:px-6">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 rounded-md focus-ring"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" /> All products
            </Link>

            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-12 items-start">
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted aspect-video">
                {trailer ? (
                  trailer.kind === "iframe" ? (
                    <iframe
                      src={trailer.src}
                      title={`${product.title} trailer`}
                      className="h-full w-full"
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                    />
                  ) : (
                    <video src={trailer.src} poster={product.cover_image_url ?? undefined} controls className="h-full w-full" />
                  )
                ) : (
                  product.cover_image_url && <img src={product.cover_image_url} alt={product.title} className="h-full w-full object-cover" />
                )}
              </div>

              <div>
                <h1 className="font-display text-display-lg font-bold mb-3 text-balance">{product.title}</h1>
                {product.tagline && <p className="text-body-lg text-muted-foreground mb-6 text-pretty">{product.tagline}</p>}

                {!!product.platforms?.length && (
                  <div className="mb-6">
                    <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Platforms</h2>
                    <ul className="flex flex-wrap gap-2">
                      {product.platforms.map((p) => (
                        <li key={p} className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-sm text-primary">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {product.store_links?.map((link, i) => (
                    <Button key={`${link.platform}-${i}`} asChild size="lg" variant={i === 0 ? "default" : "outline"} className={i === 0 ? "glow-primary" : ""}>
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        Get it on {storeLabel(link.platform)}
                        <ExternalLink className="w-4 h-4 ml-2" aria-hidden="true" />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    </Button>
                  ))}
                  <Button variant="ghost" onClick={share} className="self-start">
                    <Share2 className="w-4 h-4 mr-2" aria-hidden="true" /> Share
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About + gallery */}
        <section className="relative container mx-auto px-4 sm:px-6 mt-14 md:mt-20 grid lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-12">
          {product.description && (
            <div>
              <h2 className="font-display text-2xl font-bold mb-4">About</h2>
              <div className="whitespace-pre-wrap leading-relaxed text-foreground/90">{product.description}</div>
            </div>
          )}

          {!!product.gallery_images?.length && (
            <div className={product.description ? "" : "lg:col-span-2"}>
              <h2 className="font-display text-2xl font-bold mb-4">Screenshots</h2>
              <ul className="grid grid-cols-2 gap-3">
                {product.gallery_images.map((src, i) => (
                  <li key={src}>
                    <button
                      type="button"
                      onClick={() => setLightbox(src)}
                      className="block w-full overflow-hidden rounded-xl border border-border/60 focus-ring"
                      aria-label={`View screenshot ${i + 1}`}
                    >
                      <img src={src} alt="" loading="lazy" className="aspect-video w-full object-cover transition-transform duration-500 hover:scale-105" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>

      <Dialog open={!!lightbox} onOpenChange={(open) => !open && setLightbox(null)}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-background/95 border-border">
          <DialogTitle className="sr-only">Screenshot</DialogTitle>
          {lightbox && <img src={lightbox} alt="" className="w-full h-auto" />}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
