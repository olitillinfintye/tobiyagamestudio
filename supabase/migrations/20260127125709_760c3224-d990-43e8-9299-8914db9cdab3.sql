-- Create enum for admin permissions
CREATE TYPE public.admin_permission AS ENUM ('messages', 'blog', 'projects', 'team', 'awards', 'settings', 'analytics', 'users');

-- Add is_super_admin column to admin_users table
ALTER TABLE public.admin_users ADD COLUMN is_super_admin boolean NOT NULL DEFAULT false;

-- Create admin_permissions table for granular access control
CREATE TABLE public.admin_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    permission admin_permission NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (user_id, permission)
);

-- Enable RLS
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check permissions
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission admin_permission)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_permissions
    WHERE user_id = _user_id
      AND permission = _permission
  ) OR EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = _user_id
      AND is_super_admin = true
  )
$$;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = _user_id
      AND is_super_admin = true
  )
$$;

-- RLS policies for admin_permissions
CREATE POLICY "Super admins can view all permissions"
ON public.admin_permissions
FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert permissions"
ON public.admin_permissions
FOR INSERT
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete permissions"
ON public.admin_permissions
FOR DELETE
USING (is_super_admin(auth.uid()));

CREATE POLICY "Users can view their own permissions"
ON public.admin_permissions
FOR SELECT
USING (auth.uid() = user_id);