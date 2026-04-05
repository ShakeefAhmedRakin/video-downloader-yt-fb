export type Platform = "facebook" | "unknown";

/**
 * Detects whether a URL is from Facebook.
 * Uses broad matching to avoid rejecting valid URLs.
 */
export function detectPlatform(url: string): Platform {
  const trimmed = url.trim().toLowerCase();

  if (
    trimmed.includes("facebook.com/") ||
    trimmed.includes("facebook.com/share") ||
    trimmed.includes("fb.watch/") ||
    trimmed.includes("fb.com/") ||
    trimmed.includes("fbcdn.net/") ||
    trimmed.includes("m.facebook.com/") ||
    trimmed.includes("web.facebook.com/") ||
    trimmed.includes("mbasic.facebook.com/")
  ) {
    return "facebook";
  }

  return "unknown";
}

/**
 * Normalizes a Facebook URL:
 * - Ensures https://
 * - Converts m.facebook.com and web.facebook.com to www.facebook.com
 * - Strips tracking parameters (fbclid, ref, etc.)
 */
export function normalizeFacebookUrl(url: string): string {
  let normalized = url.trim();

  if (!normalized.startsWith("http")) {
    normalized = "https://" + normalized;
  }

  // Convert mobile/web variants to www
  normalized = normalized.replace(
    /\/(m|web|mbasic)\.facebook\.com\//,
    "/www.facebook.com/"
  );

  // Strip tracking params
  try {
    const parsed = new URL(normalized);
    const trackingParams = ["fbclid", "ref", "ref_type", "fref", "__tn__", "__cft__", "mibextid"];
    trackingParams.forEach((p) => parsed.searchParams.delete(p));
    normalized = parsed.toString();
  } catch {
    // URL parsing failed, return as-is
  }

  return normalized;
}
