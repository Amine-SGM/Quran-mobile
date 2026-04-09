# Quran Short Maker (Tauri)

Create beautiful short-form videos with Quranic recitations, background videos, and optional Arabic/English subtitles. A privacy-first application that processes everything on your device using Tauri 2.0 and FFmpeg.

---

## Features

- **All 114 Surahs** — Browse and search the complete Quran
- **Multiple Reciters** — Choose from popular reciters (Alafasy, Sudais, and more)
- **Stock Video Search** — Search Pexels for free stock footage with your own API key
- **Upload Your Own Video** — MP4, MOV, or WEBM
- **Arabic Subtitles** — Proper text shaping and RTL layout (Noto Sans Arabic)
- **Word-Level Karaoke** — Synchronized highlighting of spoken words
- **English Translation** — Optional English subtitles below Arabic
- **Aspect Ratios** — 9:16 (vertical), 1:1 (square), 4:5 (portrait), 16:9 (landscape)
- **Export Resolution** — 720p, 1080p, 2K, 4K
- **Privacy First** — All processing on-device, no data leaves your device

---

## Quick Start

### Prerequisites

- **Node.js**: v22.11.0 or newer
- **Rust**: Latest stable version
- **Android SDK**: For mobile builds (API 26+)
- **FFmpeg**: Handled via `ffmpeg-kit-android` on mobile and system binaries on desktop.

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/quran-shorts-maker.git
cd "quran shorts maker"

# Install dependencies
npm install
```

### Running the App

**Development:**
```bash
npm run tauri dev
```

**Production Build:**
```bash
npm run tauri build
```

---

## Usage

1. **Browse** — Open the app and browse all 114 Surahs
2. **Select** — Choose a Surah and Ayah range
3. **Reciter** — Select your preferred reciter
4. **Video** — Upload a video file or search Pexels
5. **Subtitles** — Configure font size, color, and karaoke highlighting
6. **Aspect Ratio** — Choose your output format
7. **Export** — Click Export and watch the progress

---

## Architecture

| Layer | Technology |
|---|---|
| Framework | Tauri 2.0 |
| UI | React + TypeScript |
| Backend | Rust |
| Video processing | FFmpeg (ffmpeg-kit-android / system) |
| Quran data | Quran.com API v4 |

---

## Privacy & Security

- **Zero Data Collection** — No analytics, no tracking
- **On-Device Processing** — All video processing happens locally
- **Secure Storage** — API keys stored in platform secure storage

---

**Made with ❤️ for the Muslim community**
