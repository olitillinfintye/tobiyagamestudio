import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Calendar, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { SectionHeader } from "./SectionHeader";
import { CardSkeleton, LoadingAnnouncer } from "./CardSkeleton";
import { cn } from "@/lib/utils";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  author_name: string;
  published_at: string | null;
  created_at: string;
  category: string | null;
}

export default function Blog() {
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("published", true)
          .order("published_at", { ascending: false });

        if (error) throw error;
        setAllPosts(data ?? []);
      } catch (error) {
        console.error("Error fetching blog posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const categories = ["all", ...new Set(allPosts.map((post) => post.category || "General"))];

  const filteredPosts =
    selectedCategory === "all"
      ? allPosts
      : allPosts.filter((post) => (post.category || "General") === selectedCategory);

  const displayedPosts = showAll ? filteredPosts : filteredPosts.slice(0, 3);
  const hasMore = filteredPosts.length > 3;

  if (loading) {
    return (
      <section id="blog" aria-label="Latest news and articles" className="section-padding relative">
        <div className="container mx-auto px-4">
          <LoadingAnnouncer label="Loading articles" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Nothing published yet — omit the section rather than show an empty shell.
  if (allPosts.length === 0) return null;

  return (
    <section id="blog" aria-labelledby="blog-heading" className="section-padding relative">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        <SectionHeader
          id="blog-heading"
          eyebrow="Blog"
          title={
            <>
              Latest <span className="gradient-text">News & Articles</span>
            </>
          }
          description="Stay updated with our latest projects, industry insights, and XR technology trends."
        />

        {categories.length > 2 && (
          <div
            role="group"
            aria-label="Filter articles by category"
            className="mb-8 flex flex-wrap justify-center gap-2"
          >
            {categories.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category);
                    setShowAll(false);
                  }}
                  aria-pressed={isActive}
                  className={cn(
                    "min-h-[44px] rounded-full px-5 text-sm font-medium capitalize transition-all focus-ring",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>
        )}

        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedPosts.map((post, index) => (
            <motion.li
              key={post.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: Math.min(0.08 * index, 0.3) }}
              className="glass-card overflow-hidden group"
            >
              <article className="flex h-full flex-col">
                <Link to={`/blog/${post.slug}`} className="flex h-full flex-col rounded-xl focus-ring">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {post.cover_image_url ? (
                      <img
                        src={post.cover_image_url}
                        alt=""
                        width={800}
                        height={500}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary">
                        <span className="font-display text-4xl text-primary/50" aria-hidden="true">
                          {post.title[0]}
                        </span>
                      </div>
                    )}
                    {post.category && (
                      <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                        {post.category}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-4 sm:p-6">
                    <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                        <time dateTime={post.published_at || post.created_at}>
                          {format(new Date(post.published_at || post.created_at), "MMM d, yyyy")}
                        </time>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" aria-hidden="true" />
                        {post.author_name}
                      </span>
                    </div>

                    <h3 className="mb-2 font-display text-base sm:text-lg font-bold line-clamp-2 transition-colors group-hover:text-primary">
                      {post.title}
                    </h3>

                    {post.excerpt && (
                      <p className="mb-4 text-sm text-muted-foreground line-clamp-2 text-pretty">
                        {post.excerpt}
                      </p>
                    )}

                    <span className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-primary">
                      Read more
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </Link>
              </article>
            </motion.li>
          ))}
        </ul>

        {hasMore && (
          <div className="mt-10 text-center">
            <Button
              variant="outline"
              onClick={() => setShowAll((v) => !v)}
              className="group min-h-[44px]"
            >
              {showAll ? "Show fewer articles" : "View all articles"}
              {!showAll && (
                <ArrowRight
                  className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              )}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
