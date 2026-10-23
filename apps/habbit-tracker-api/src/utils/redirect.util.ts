import { env } from "../config/env.js";

const RELATIVE_BASE = "https://redirect.invalid";

// Backslashes and control characters are normalized to "/" by browsers for
// http(s) URLs, which is how "/\evil.example" becomes a cross-origin redirect.
const UNSAFE_CHARS = /[\\\u0000-\u001F\u007F]/;

function allowedOrigins(): string[] {
  return (env.ALLOWED_REDIRECT_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function isSafeRelativePath(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (UNSAFE_CHARS.test(value)) return false;

  // Resolve the way a browser would; anything that escapes the base origin is
  // an absolute URL in disguise.
  try {
    return new URL(value, RELATIVE_BASE).origin === RELATIVE_BASE;
  } catch {
    return false;
  }
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
    return isSafeRelativePath(value) ? value : null;
  }

  if (UNSAFE_CHARS.test(value)) return null;

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
