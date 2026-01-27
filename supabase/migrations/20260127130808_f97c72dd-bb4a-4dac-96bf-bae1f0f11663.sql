-- Add social media columns to team_members
ALTER TABLE public.team_members 
ADD COLUMN linkedin_url text,
ADD COLUMN twitter_url text;

-- Insert hero_3d_model setting if it doesn't exist
INSERT INTO public.site_settings (key, value, label)
VALUES ('hero_3d_model', '/models/vr_headset.glb', 'Hero 3D Model')
ON CONFLICT (key) DO NOTHING;