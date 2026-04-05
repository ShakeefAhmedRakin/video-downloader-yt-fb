# Video Downloader - YouTube & Facebook

A simple, free web app to download YouTube and Facebook videos in 720p or lower. Built with Next.js and designed for ease of use.

## Features

- **Single input field** - paste any YouTube or Facebook video link
- **Auto-detection** - automatically detects the platform (YouTube or Facebook)
- **720p max quality** - downloads in the best available quality up to 720p
- **YouTube Shorts support** - works with regular videos and Shorts
- **Facebook Reels support** - works with Facebook videos and Reels
- **Real-time status** - clear step-by-step progress indicators
- **Simple UI** - large buttons, clear text, easy for everyone to use
- **No sign-up required** - completely free, no accounts needed

## Supported Links

| Platform | Supported URL Formats |
|----------|----------------------|
| YouTube  | `youtube.com/watch?v=...`, `youtu.be/...`, `youtube.com/shorts/...` |
| Facebook | `facebook.com/.../videos/...`, `facebook.com/watch/...`, `facebook.com/reel/...`, `fb.watch/...`, `facebook.com/share/v/...` |

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 16 (App Router, standalone mode)
- **Language**: TypeScript
- **YouTube Downloads**: [youtubei.js](https://github.com/LuanRT/YouTube.js) (InnerTube API)
- **Facebook Downloads**: Custom HTML scraper
- **Styling**: CSS with Tailwind utilities
- **Deployment**: [Render](https://render.com/) (Singapore region, free tier)

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd youtube-fb-downloader

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Deploying to Render

### Option 1: render.yaml (Recommended)

The project includes a `render.yaml` blueprint pre-configured for deployment:

1. Push the code to a GitHub repository
2. Go to [render.com](https://render.com/) and sign in
3. Click **New** > **Blueprint** and connect your GitHub repo
4. Render will auto-detect `render.yaml` and set everything up
5. Click **Apply**

### Option 2: Manual Setup

1. Push the code to a GitHub repository
2. Go to [render.com](https://render.com/) > **New** > **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Runtime**: Node
   - **Region**: Singapore
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Add environment variables:
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
   - `HOSTNAME` = `0.0.0.0`
6. Click **Deploy**

### Render Free Tier Notes

- The service sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds (cold start)
- No function timeout limits — video downloads work reliably
- Free custom domain support via CNAME

## How It Works

1. **User pastes a link** into the input field
2. **Platform detection** identifies whether it's YouTube or Facebook
3. **Video info fetch**:
   - YouTube: Uses `youtubei.js` (InnerTube API) to get video metadata and the best combined audio+video format
   - Facebook: Fetches the page HTML and extracts the video source URL using multiple fallback strategies
4. **Download proxy**: The video is streamed through `/api/download` to handle CORS and provide a proper file download with a shortened filename

## Project Structure

```
youtube-fb-downloader/
├── app/
│   ├── api/
│   │   ├── info/route.ts        # Video info endpoint
│   │   └── download/route.ts    # Download proxy endpoint
│   ├── globals.css              # Styles and animations
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main page (client component)
├── lib/
│   ├── url-detect.ts            # URL detection and parsing
│   ├── youtube.ts               # YouTube video info extraction (youtubei.js)
│   └── facebook.ts              # Facebook video info extraction
├── next.config.ts               # Next.js config (standalone output)
├── render.yaml                  # Render deployment blueprint
└── README.md
```

## Limitations

- Facebook private videos cannot be downloaded (only public videos)
- YouTube combined (audio+video) format is typically 360p; 720p requires ffmpeg for stream merging which is not available on Render
- Facebook's page structure changes occasionally, which may require scraper updates
- Render free tier sleeps after 15 min inactivity (cold start ~30s)

## License

MIT
