import { normalizeFacebookUrl } from "./url-detect";

export interface FacebookVideoInfo {
  title: string;
  thumbnail: string;
  downloadUrl: string;
  quality: string;
  platform: "facebook";
}

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * Resolves fb.watch and other short URLs by following redirects.
 */
async function resolveRedirects(url: string): Promise<string> {
  if (!url.includes("fb.watch/") && !url.includes("/share/")) {
    return url;
  }

  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });
    return response.url || url;
  } catch {
    // If HEAD fails, try GET
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        redirect: "follow",
      });
      return response.url || url;
    } catch {
      return url;
    }
  }
}

/**
 * Extracts video download URL from a Facebook video page.
 * Uses multiple strategies to find the video source URL.
 */
export async function getFacebookInfo(
  inputUrl: string
): Promise<FacebookVideoInfo> {
  // Resolve short URLs first (fb.watch, share links)
  let url = await resolveRedirects(inputUrl);
  url = normalizeFacebookUrl(url);

  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
  };

  const response = await fetch(url, {
    headers,
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(
      "Could not access the Facebook video. Please check the link and try again."
    );
  }

  const html = await response.text();

  // Try all extraction strategies in order of reliability
  const videoUrl = extractVideoUrl(html);

  if (!videoUrl) {
    throw new Error(
      "Could not find the video. The video might be private or the link may be incorrect. Please try a different link."
    );
  }

  // Extract title from page
  const title = extractTitle(html);

  // Extract thumbnail
  const thumbnail = extractThumbnail(html);

  return {
    title,
    thumbnail,
    downloadUrl: videoUrl,
    quality: "SD",
    platform: "facebook",
  };
}

/**
 * Tries multiple regex strategies to extract the video URL from page HTML.
 */
function extractVideoUrl(html: string): string | null {
  const strategies: RegExp[] = [
    // SD source (most common for public videos)
    /"sd_src"\s*:\s*"([^"]+)"/,
    /"sd_src_no_ratelimit"\s*:\s*"([^"]+)"/,

    // Playable URL (in JSON data)
    /"playable_url"\s*:\s*"([^"]+)"/,
    /"playable_url_dash"\s*:\s*"([^"]+)"/,

    // Browser native URLs
    /"browser_native_sd_url"\s*:\s*"([^"]+)"/,
    /"browser_native_hd_url"\s*:\s*"([^"]+)"/,

    // HD sources (fallback — still better than nothing)
    /"hd_src"\s*:\s*"([^"]+)"/,
    /"hd_src_no_ratelimit"\s*:\s*"([^"]+)"/,
    /"playable_url_quality_hd"\s*:\s*"([^"]+)"/,

    // Video tag in HTML
    /<video[^>]+src="([^"]+)"/i,

    // Content URL in meta
    /property="og:video"\s+content="([^"]+)"/i,
    /property="og:video:url"\s+content="([^"]+)"/i,
    /property="og:video:secure_url"\s+content="([^"]+)"/i,

    // Generic mp4 URL (last resort)
    /(https?:\\\/\\\/[^"'\s]+\.mp4[^"'\s]*)/,
  ];

  for (const pattern of strategies) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return cleanUrl(match[1]);
    }
  }

  return null;
}

/**
 * Cleans up escaped characters in extracted URLs.
 */
function cleanUrl(url: string): string {
  return url
    .replace(/\\u0025/g, "%")
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&")
    .replace(/\\x3c/g, "<")
    .replace(/\\x3e/g, ">");
}

/**
 * Extracts the page title, cleaning up Facebook suffixes.
 */
function extractTitle(html: string): string {
  // Try og:title first (most reliable)
  const ogTitle = html.match(/property="og:title"\s+content="([^"]+)"/i);
  if (ogTitle?.[1]) {
    const title = decodeEntities(ogTitle[1]).trim();
    if (title && title !== "Facebook" && title !== "Watch") {
      return title;
    }
  }

  // Fallback to <title> tag
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleTag?.[1]) {
    const title = decodeEntities(titleTag[1])
      .replace(/\s*[||-]\s*Facebook\s*$/i, "")
      .trim();
    if (title && title !== "Facebook") {
      return title;
    }
  }

  return "Facebook Video";
}

/**
 * Extracts thumbnail URL from page meta tags.
 */
function extractThumbnail(html: string): string {
  const patterns = [
    /property="og:image"\s+content="([^"]+)"/i,
    /name="thumbnail"\s+content="([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return cleanUrl(match[1]);
    }
  }

  return "";
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}
