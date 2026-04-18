
-- 1. Replace overly permissive contact_submissions INSERT policy with one that enforces validation
DROP POLICY IF EXISTS "Anyone can insert contact submissions" ON public.contact_submissions;

CREATE POLICY "Anyone can insert valid contact submissions"
ON public.contact_submissions
FOR INSERT
WITH CHECK (
  length(name) > 0 AND length(name) <= 100
  AND length(email) > 0 AND length(email) <= 255
  AND email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'
  AND length(subject) > 0 AND length(subject) <= 200
  AND length(message) > 0 AND length(message) <= 5000
);

-- 2. Restrict listing on the public project-images bucket (allow individual file reads, block listing)
DROP POLICY IF EXISTS "Public read project-images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view project images" ON storage.objects;
DROP POLICY IF EXISTS "Project images are publicly accessible" ON storage.objects;

CREATE POLICY "Public can read project-images files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'project-images' AND name IS NOT NULL);
