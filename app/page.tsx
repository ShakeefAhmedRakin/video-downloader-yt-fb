"use client";

import { useState, useCallback } from "react";

type Status = "idle" | "detecting" | "fetching" | "ready" | "error";

interface VideoResult {
  title: string;
  thumbnail: string;
  downloadUrl: string;
  quality: string;
  platform: "facebook";
}

const STATUS_MESSAGES: Record<Status, string> = {
  idle: "",
  detecting: "Checking your link...",
  fetching: "Getting video information...",
  ready: "Your video is ready to download!",
  error: "",
};

const STEPS = [
  { key: "detecting", label: "Checking link" },
  { key: "fetching", label: "Finding video" },
  { key: "ready", label: "Ready to download" },
] as const;

function getStepState(
  stepKey: string,
  currentStatus: Status
): "pending" | "active" | "done" {
  const order = ["detecting", "fetching", "ready"];
  const currentIdx = order.indexOf(currentStatus);
  const stepIdx = order.indexOf(stepKey);
  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "active";
  return "pending";
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [video, setVideo] = useState<VideoResult | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!url.trim()) {
        setError("Please paste a video link first.");
        setStatus("error");
        return;
      }

      setError("");
      setVideo(null);
      setStatus("detecting");

      // Brief pause so the user sees the "checking" step
      await new Promise((r) => setTimeout(r, 600));
      setStatus("fetching");

      try {
        const res = await fetch("/api/info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Something went wrong. Please try again.");
          setStatus("error");
          return;
        }

        setVideo(data);
        setStatus("ready");
      } catch {
        setError(
          "Could not connect to the server. Please check your internet and try again."
        );
        setStatus("error");
      }
    },
    [url]
  );

  const handleDownload = useCallback(() => {
    if (!video) return;

    // Shorten the title for the filename (max 50 chars, clean for filesystem)
    const shortTitle = video.title
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .substring(0, 50)
      .replace(/_+$/, "");

    const filename = encodeURIComponent(shortTitle || "video");
    const videoUrl = encodeURIComponent(video.downloadUrl);
    const downloadPath = `/api/download?url=${videoUrl}&filename=${filename}`;

    window.open(downloadPath, "_blank");
  }, [video]);

  const handleReset = useCallback(() => {
    setUrl("");
    setStatus("idle");
    setError("");
    setVideo(null);
  }, []);

  const isProcessing = status === "detecting" || status === "fetching";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px",
      }}
    >
      {/* Header */}
      <header className="animate-fade-in-up" style={{ textAlign: "center", marginBottom: 40 }}>
        <div
          style={{
            fontSize: 48,
            marginBottom: 16,
          }}
        >
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ margin: "0 auto" }}>
            <circle cx="28" cy="28" r="28" fill="#1877f2" />
            <path
              d="M22 17L40 28L22 39V17Z"
              fill="white"
              stroke="white"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#1e293b",
            marginBottom: 8,
            lineHeight: 1.2,
          }}
        >
          Facebook Video Downloader
        </h1>
        <p
          style={{
            fontSize: 18,
            color: "#64748b",
            maxWidth: 400,
            margin: "0 auto",
            lineHeight: 1.5,
          }}
        >
          Download Facebook videos for free. Just paste the link below.
        </p>
      </header>

      {/* Main Card */}
      <main
        className="card animate-fade-in-up"
        style={{
          width: "100%",
          maxWidth: 560,
          padding: "36px 32px",
          animationDelay: "0.1s",
          animationFillMode: "backwards",
        }}
      >
        {/* Input Form */}
        <form onSubmit={handleSubmit}>
          <label
            htmlFor="video-url"
            style={{
              display: "block",
              fontSize: 17,
              fontWeight: 600,
              color: "#334155",
              marginBottom: 10,
            }}
          >
            Video Link
          </label>
          <input
            id="video-url"
            type="text"
            className="input-field"
            placeholder="Paste Facebook video link here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isProcessing}
            autoComplete="off"
            autoFocus
          />

          <button
            type="submit"
            className="btn-primary"
            disabled={isProcessing || !url.trim()}
            style={{ width: "100%", marginTop: 16 }}
          >
            {isProcessing ? (
              <>
                <span className="spinner animate-spin" />
                Please wait...
              </>
            ) : (
              <>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Get Video
              </>
            )}
          </button>
        </form>

        {/* Progress Steps */}
        {isProcessing && (
          <div
            className="animate-slide-down"
            style={{ marginTop: 24, padding: "0 4px" }}
          >
            {STEPS.map((step) => {
              const state = getStepState(step.key, status);
              return (
                <div
                  key={step.key}
                  className={`step-indicator ${state === "active" ? "active" : ""} ${state === "done" ? "done" : ""}`}
                >
                  <span className="step-dot" />
                  <span>{step.label}</span>
                  {state === "active" && (
                    <span className="spinner animate-spin" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  )}
                  {state === "done" && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        className="animate-check"
                        d="M5 13l4 4L19 7"
                        stroke="#22c55e"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Error Message */}
        {status === "error" && error && (
          <div
            className="status-box status-error animate-slide-down"
            style={{ marginTop: 20 }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Video Result */}
        {status === "ready" && video && (
          <div className="animate-fade-in-up" style={{ marginTop: 28 }}>
            {/* Success Banner */}
            <div
              className="status-box status-success"
              style={{ marginBottom: 20 }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                style={{ flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="10" fill="#22c55e" />
                <path
                  d="M8 12.5l2.5 2.5L16 9.5"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{STATUS_MESSAGES.ready}</span>
            </div>

            {/* Thumbnail */}
            {video.thumbnail && (
              <div className="video-thumbnail animate-scale-in" style={{ marginBottom: 16 }}>
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover" }}
                />
              </div>
            )}

            {/* Video Info */}
            <div style={{ marginBottom: 20 }}>
              <h2
                style={{
                  fontSize: 19,
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: 8,
                  lineHeight: 1.4,
                }}
              >
                {video.title}
              </h2>
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                  fontSize: 15,
                  color: "#64748b",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#f1f5f9",
                    padding: "4px 12px",
                    borderRadius: 8,
                    fontWeight: 500,
                  }}
                >
                  Facebook
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#f1f5f9",
                    padding: "4px 12px",
                    borderRadius: 8,
                    fontWeight: 500,
                  }}
                >
                  {video.quality}
                </span>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="btn-download animate-bounce-gentle"
              style={{ width: "100%" }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Video
            </button>

            {/* Try Another */}
            <button
              onClick={handleReset}
              style={{
                width: "100%",
                marginTop: 12,
                padding: "14px 24px",
                fontSize: 16,
                fontWeight: 500,
                color: "#64748b",
                background: "transparent",
                border: "2px solid #e2e8f0",
                borderRadius: 12,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "#cbd5e1";
                e.currentTarget.style.color = "#475569";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.color = "#64748b";
              }}
            >
              Download Another Video
            </button>
          </div>
        )}
      </main>

      {/* Supported Platforms */}
      <section
        className="animate-fade-in"
        style={{
          marginTop: 32,
          textAlign: "center",
          animationDelay: "0.3s",
          animationFillMode: "backwards",
        }}
      >
        <p style={{ fontSize: 15, color: "#94a3b8", marginBottom: 12 }}>
          Works with
        </p>
        <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#64748b",
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#1877f2">
              <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
            </svg>
            Facebook Videos
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#64748b",
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#1877f2">
              <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
            </svg>
            Facebook Reels
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          marginTop: "auto",
          paddingTop: 40,
          paddingBottom: 20,
          textAlign: "center",
        }}
      >
        <p className="footer-text">
          Free to use. Videos are not stored on our servers.
        </p>
      </footer>
    </div>
  );
}
