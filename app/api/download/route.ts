import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

/**
 * Proxies video download to avoid CORS issues.
 * The client passes the direct video URL as a query parameter.
 */
export async function GET(request: NextRequest) {
  try {
    const videoUrl = request.nextUrl.searchParams.get("url");
    const filename = request.nextUrl.searchParams.get("filename") || "video";

    if (!videoUrl) {
      return NextResponse.json(
        { error: "No video URL provided." },
        { status: 400 }
      );
    }

    const response = await fetch(videoUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok || !response.body) {
      return NextResponse.json(
        { error: "Could not download the video. The link may have expired. Please try again." },
        { status: 502 }
      );
    }

    const contentType =
      response.headers.get("content-type") || "video/mp4";
    const contentLength = response.headers.get("content-length");

    const sanitizedFilename = filename
      .replace(/[^a-zA-Z0-9\s\-_]/g, "")
      .trim()
      .substring(0, 100);

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${sanitizedFilename}.mp4"`,
      "Cache-Control": "no-cache",
    };

    if (contentLength) {
      headers["Content-Length"] = contentLength;
    }

    return new NextResponse(response.body, { status: 200, headers });
  } catch (err) {
    console.error("Download proxy error:", err);
    return NextResponse.json(
      { error: "Download failed. Please try again." },
      { status: 500 }
    );
  }
}
