import { NextRequest, NextResponse } from "next/server";
import { detectPlatform } from "@/lib/url-detect";
import { getFacebookInfo } from "@/lib/facebook";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Please paste a video link to get started." },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith("http")) {
      return NextResponse.json(
        {
          error:
            "That doesn't look like a valid link. Please paste a full link starting with https://",
        },
        { status: 400 }
      );
    }

    const platform = detectPlatform(trimmedUrl);

    if (platform === "unknown") {
      return NextResponse.json(
        {
          error:
            "This link is not from Facebook. Please paste a Facebook video link.",
        },
        { status: 400 }
      );
    }

    const info = await getFacebookInfo(trimmedUrl);
    return NextResponse.json(info);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Something went wrong. Please try again.";

    console.error("Video info error:", err);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
