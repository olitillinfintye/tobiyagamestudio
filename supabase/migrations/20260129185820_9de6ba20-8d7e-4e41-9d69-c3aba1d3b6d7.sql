-- Create partners table for partner logos
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Anyone can view active partners
CREATE POLICY "Anyone can view active partners"
ON public.partners
FOR SELECT
USING (is_active = true);

-- Admins can view all partners
CREATE POLICY "Admins can view all partners"
ON public.partners
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can insert partners
CREATE POLICY "Admins can insert partners"
ON public.partners
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Admins can update partners
CREATE POLICY "Admins can update partners"
ON public.partners
FOR UPDATE
USING (is_admin(auth.uid()));

-- Admins can delete partners
CREATE POLICY "Admins can delete partners"
ON public.partners
FOR DELETE
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_partners_updated_at
BEFORE UPDATE ON public.partners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();