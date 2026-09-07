-- Grant super-admin rights to an existing auth user.
--
-- PREREQUISITE: the user must already exist in Supabase Auth. Create them first
-- via Dashboard -> Authentication -> Users -> "Add user" -> "Create new user"
-- (tick "Auto Confirm User" so they can log in without an email round-trip).
--
-- This script does NOT create auth users. Hand-inserting into auth.users means
-- hashing the password yourself and populating a dozen internal columns; getting
-- any of them wrong produces an account that fails to log in with no useful
-- error. Let Supabase own that table.
--
-- Super admin is all-or-nothing: useAdminPermissions() short-circuits on
-- is_super_admin and grants every permission, so no admin_permissions rows are
-- needed. Run this in Dashboard -> SQL Editor.

BEGIN;

DO $$
DECLARE
  target_email text := 'oliyadtesfaye2020@gmail.com';  -- <- change per user
  target_id    uuid;
BEGIN
  SELECT id INTO target_id
  FROM auth.users
  WHERE lower(email) = lower(target_email);

  IF target_id IS NULL THEN
    RAISE EXCEPTION
      'No auth user found for %. Create them in Authentication -> Users first.',
      target_email;
  END IF;

  -- user_id is UNIQUE, so this is safe to re-run and will promote an existing
  -- ordinary admin to super admin rather than erroring.
  INSERT INTO public.admin_users (user_id, is_super_admin)
  VALUES (target_id, true)
  ON CONFLICT (user_id)
  DO UPDATE SET is_super_admin = true;

  RAISE NOTICE 'Granted super admin to % (user_id %)', target_email, target_id;
END $$;

COMMIT;

-- Verify:
SELECT u.email,
       a.is_super_admin,
       u.email_confirmed_at IS NOT NULL AS can_log_in,
       a.created_at
FROM public.admin_users a
JOIN auth.users u ON u.id = a.user_id
ORDER BY a.is_super_admin DESC, u.email;
