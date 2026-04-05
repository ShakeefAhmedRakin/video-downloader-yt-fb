export type Platform = "youtube" | "facebook" | "unknown";

/**
 * Detects whether a URL is from YouTube or Facebook.
 * Uses broad matching to avoid rejecting valid URLs.
 */
export function detectPlatform(url: string): Platform {
  const trimmed = url.trim().toLowerCase();

  // YouTube detection
  if (
    trimmed.includes("youtube.com/") ||
    trimmed.includes("youtu.be/") ||
    trimmed.includes("youtube-nocookie.com/")
  ) {
    return "youtube";
  }

  // Facebook detection — be very permissive
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

export function extractYouTubeId(url: string): string | null {
  const trimmed = url.trim();

  // youtube.com/shorts/ID
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([\w-]+)/);
  if (shortsMatch) return shortsMatch[1];

  // youtube.com/watch?v=ID
  const watchMatch = trimmed.match(/[?&]v=([\w-]+)/);
  if (watchMatch) return watchMatch[1];

  // youtu.be/ID
  const shortMatch = trimmed.match(/youtu\.be\/([\w-]+)/);
  if (shortMatch) return shortMatch[1];

  // youtube.com/embed/ID
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([\w-]+)/);
  if (embedMatch) return embedMatch[1];

  // youtube.com/live/ID
  const liveMatch = trimmed.match(/youtube\.com\/live\/([\w-]+)/);
  if (liveMatch) return liveMatch[1];

  return null;
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
