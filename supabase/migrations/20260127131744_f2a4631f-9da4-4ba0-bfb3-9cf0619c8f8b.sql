-- Add category column to blog_posts
ALTER TABLE public.blog_posts 
ADD COLUMN category text DEFAULT 'General';

-- Create an index for faster category filtering
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category);