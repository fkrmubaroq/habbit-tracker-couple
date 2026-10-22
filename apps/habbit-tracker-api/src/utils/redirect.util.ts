import { env } from "../config/env.js";

function allowedOrigins(): string[] {
  return (env.ALLOWED_REDIRECT_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

/**
 * Validates a post-login redirect target.
 * Accepts a relative path ("/habits") or an absolute URL whose origin is
 * whitelisted via ALLOWED_REDIRECT_ORIGINS. Anything else returns null.
 */
export function resolveRedirectTarget(returnTo?: string | null): string | null {
  if (!returnTo) return null;

  const value = returnTo.trim();
  if (!value) return null;

  if (value.startsWith("/")) {
    if (value.startsWith("//")) return null;
    return value;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    const origin = url.origin.replace(/\/$/, "");
    if (!allowedOrigins().includes(origin)) return null;

    return url.toString();
  } catch {
    return null;
  }
}
