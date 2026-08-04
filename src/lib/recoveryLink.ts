/**
 * Records whether the app was opened from a Supabase password-recovery email.
 *
 * Supabase sends the user to `/admin#access_token=...&type=recovery`. The
 * supabase-js client has `detectSessionInUrl` enabled by default, so it consumes
 * that hash and strips it from the URL as soon as it initialises. The `/admin`
 * route is lazy-loaded, which means the client can finish that cleanup before
 * the Admin component ever mounts and gets a chance to read the URL.
 *
 * This module is imported at the top of `main.tsx`, before anything that pulls in
 * the supabase client, so the flag is captured while the hash is still intact.
 */
export const isPasswordRecoveryLink =
  typeof window !== "undefined" && /[#&]type=recovery/.test(window.location.hash);
