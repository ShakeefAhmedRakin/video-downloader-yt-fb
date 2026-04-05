import { Innertube, Platform } from "youtubei.js";
import vm from "vm";
import { extractYouTubeId } from "./url-detect";

export interface VideoInfo {
  title: string;
  thumbnail: string;
  downloadUrl: string;
  quality: string;
  duration: string;
  platform: "youtube";
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Provide a JavaScript evaluator for youtubei.js to decipher video URLs.
// This is required because youtubei.js doesn't ship with one by default.
const shim = Platform.shim;
if (shim) {
  shim.eval = (data: { output: string }, args: Record<string, unknown>) => {
    const sandbox = { ...args };
    const ctx = vm.createContext(sandbox);
    const wrapped = "(function() { " + data.output + " })()";
    const result = vm.runInContext(wrapped, ctx);
    return {
      ...sandbox,
      ...(typeof result === "object" && result !== null ? result : {}),
    };
  };
}

let innertubeInstance: Innertube | null = null;

async function getInnertube(): Promise<Innertube> {
  if (!innertubeInstance) {
    innertubeInstance = await Innertube.create({
      retrieve_player: true,
    });
  }
  return innertubeInstance;
}

export async function getYouTubeInfo(url: string): Promise<VideoInfo> {
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    throw new Error(
      "Could not find the video. Please check the link and try again."
    );
  }

  try {
    const yt = await getInnertube();
    const info = await yt.getBasicInfo(videoId);

    if (!info.basic_info) {
      throw new Error("Could not load video information.");
    }

    const title = info.basic_info.title ?? "YouTube Video";
    const durationSec = info.basic_info.duration ?? 0;
    const thumbnail =
      info.basic_info.thumbnail?.[info.basic_info.thumbnail.length - 1]?.url ??
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    // Use the best combined (audio+video) format — typically 360p.
    // Higher qualities (720p+) are video-only and require ffmpeg to merge.
    const format = info.chooseFormat({
      type: "video+audio",
      quality: "best",
    });

    if (!format) {
      throw new Error(
        "No downloadable format found. The video may be restricted."
      );
    }

    const downloadUrl = await format.decipher(yt.session.player);

    const height = format.height ?? 0;
    const quality = height > 0 ? `${Math.min(height, 720)}p` : "SD";

    return {
      title,
      thumbnail,
      downloadUrl,
      quality,
      duration: formatDuration(durationSec),
      platform: "youtube",
    };
  } catch (err) {
    // Reset instance on failure so next request gets a fresh one
    innertubeInstance = null;

    if (err instanceof Error && err.message.includes("Could not")) {
      throw err;
    }
    if (err instanceof Error && err.message.includes("No downloadable")) {
      throw err;
    }

    console.error("YouTube extraction error:", err);
    throw new Error(
      "Could not download this video. It may be private, age-restricted, or unavailable. Please try a different video."
    );
  }
}
