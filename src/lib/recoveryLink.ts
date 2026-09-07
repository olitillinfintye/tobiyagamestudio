export const isPasswordRecoveryLink =
  typeof window !== "undefined" && new URLSearchParams(window.location.hash.slice(1)).has("recovery_token");
