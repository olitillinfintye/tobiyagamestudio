-- Create contact_submissions table for storing form submissions
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit contact forms
CREATE POLICY "Anyone can insert contact submissions"
ON public.contact_submissions
FOR INSERT
WITH CHECK (true);

-- Only admins can view submissions
CREATE POLICY "Admins can view contact submissions"
ON public.contact_submissions
FOR SELECT
USING (is_admin(auth.uid()));

-- Only admins can update submissions (mark as read)
CREATE POLICY "Admins can update contact submissions"
ON public.contact_submissions
FOR UPDATE
USING (is_admin(auth.uid()));

-- Only admins can delete submissions
CREATE POLICY "Admins can delete contact submissions"
ON public.contact_submissions
FOR DELETE
USING (is_admin(auth.uid()));