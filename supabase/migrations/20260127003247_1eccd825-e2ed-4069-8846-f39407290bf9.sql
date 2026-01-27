-- Create site_settings table for configurable values
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  label text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view settings
CREATE POLICY "Anyone can view settings" ON public.site_settings
  FOR SELECT USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can insert settings" ON public.site_settings
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update settings" ON public.site_settings
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete settings" ON public.site_settings
  FOR DELETE USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default hero stats
INSERT INTO public.site_settings (key, value, label) VALUES
  ('hero_projects', '15+', 'Projects'),
  ('hero_team_members', '6', 'Team Members'),
  ('hero_awards', '3', 'Awards'),
  ('hero_years', '2+', 'Years');