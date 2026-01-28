-- Add social_links column to team_members for custom social media links
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.team_members.social_links IS 'Array of {platform, url, icon} objects for custom social media links';

-- Insert default contact information settings if they don't exist
INSERT INTO public.site_settings (key, value, label)
VALUES 
  ('contact_email', 'oliyadtesfaye2020@gmail.com', 'Email'),
  ('contact_phone', '+251 922039319', 'Phone'),
  ('contact_location', 'Mexico, Addis Ababa, Ethiopia', 'Location'),
  ('contact_website', 'www.tobiyastudio.com', 'Website')
ON CONFLICT (key) DO NOTHING;