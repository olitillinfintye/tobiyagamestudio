-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Sparkles',
  features TEXT[] DEFAULT '{}'::TEXT[],
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Anyone can view services
CREATE POLICY "Anyone can view services"
ON public.services
FOR SELECT
USING (true);

-- Admins can insert services
CREATE POLICY "Admins can insert services"
ON public.services
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Admins can update services
CREATE POLICY "Admins can update services"
ON public.services
FOR UPDATE
USING (is_admin(auth.uid()));

-- Admins can delete services
CREATE POLICY "Admins can delete services"
ON public.services
FOR DELETE
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default services data
INSERT INTO public.services (title, description, icon, features, display_order) VALUES
('Game Development', 'We craft engaging games across multiple platforms, from mobile to console. Our team brings ideas to life with stunning visuals, compelling narratives, and addictive gameplay mechanics.', 'Gamepad2', ARRAY['Cross-platform development', '2D & 3D games', 'Mobile & console'], 1),
('AR/VR Application Development', 'Immersive AR and VR applications that transport users to new realities. We specialize in creating experiences for training, education, entertainment, and enterprise solutions.', 'Glasses', ARRAY['Virtual Reality', 'Augmented Reality', 'Mixed Reality'], 2),
('Prototyping & Concept VR', 'Rapid prototyping services to validate ideas and concepts before full development. We help visualize and test your vision in virtual space.', 'Lightbulb', ARRAY['Rapid prototyping', 'Concept validation', 'Proof of concept'], 3),
('Interactive Experience Design', 'Creating memorable interactive installations and digital experiences for events, exhibitions, and brand activations that captivate and engage audiences.', 'Sparkles', ARRAY['Interactive installations', 'Event experiences', 'Digital activations'], 4);