import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { AspectRatio, Resolution, PexelsVideo, VideoSource } from "../types";
import { VideoThumbnail } from "../components/VideoThumbnail";
import { ApiKeyModal } from "../components/ApiKeyModal";
import { DownloadProgress } from "../components/DownloadProgress";
import "./StockVideoScreen.css";

interface StockVideoScreenProps {
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
  reciterId: number;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  onBack: () => void;
  onSelect: (videoSource: VideoSource) => void;
}

interface SearchResponse {
  videos: PexelsVideo[];
  total_results: number;
}

interface StockVideoResponse {
  cache_path: string;
  width: number;
  height: number;
  duration: number;
}

export function StockVideoScreen({
  surahNumber,
  ayahStart,
  ayahEnd,
  reciterId: _reciterId,
  aspectRatio,
  resolution,
  onBack,
  onSelect,
}: StockVideoScreenProps) {
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState<PexelsVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    checkApiKey();
  }, []);

  async function checkApiKey() {
    try {
      const settings = await invoke<{ pexels_api_key_set: boolean }>("get_settings");
      if (!settings.pexels_api_key_set) {
        setShowApiKeyModal(true);
      }
    } catch (err) {
      console.error("Failed to check API key:", err);
    }
  }

  async function handleSearch() {
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const response: SearchResponse = await invoke("search_pexels_videos", {
        query,
        aspectRatio,
        resolution,
        perPage: 20,
      });

      setVideos(response.videos);
    } catch (err) {
      const errMsg = err as string;
      if (errMsg === "API_KEY_NOT_SET") {
        setShowApiKeyModal(true);
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectVideo(video: PexelsVideo) {
const bestFile = video.videoFiles.find(
    (f) => f.fileType === "video/mp4"
  ) || video.videoFiles[0];

    if (!bestFile) {
      setError("No suitable video file found");
      return;
    }

    try {
      setDownloading(video.id);
      setDownloadProgress(0);

      const response: StockVideoResponse = await invoke("download_stock_video", {
        videoId: video.id,
        videoUrl: bestFile.link,
      });

      const videoSource: VideoSource = {
        type: "stock",
        localPath: null,
        stockVideoId: video.id,
        stockVideoUrl: bestFile.link,
        width: response.width,
        height: response.height,
        duration: response.duration,
      };

      onSelect(videoSource);
    } catch (err) {
      setError(err as string);
    } finally {
      setDownloading(null);
    }
  }

  const handleApiKeySubmit = async (key: string) => {
    await invoke("set_settings", {
      params: { pexels_api_key: key },
    });
    setShowApiKeyModal(false);
    handleSearch();
  };

  return (
    <div className="stock-video-screen">
      <header className="stock-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>Stock Videos</h1>
        <p className="search-info">
          Surah {surahNumber}, Ayahs {ayahStart}-{ayahEnd} • {aspectRatio} @ {resolution}
        </p>
      </header>

      <div className="search-bar">
        <input
          type="text"
          placeholder={`Search for "${aspectRatio}" videos...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="video-grid">
        {videos.map((video) => (
          <VideoThumbnail
            key={video.id}
            video={video}
            onSelect={() => handleSelectVideo(video)}
            isLoading={downloading === video.id}
          />
        ))}
      </div>

      {videos.length === 0 && !loading && query && (
        <div className="empty-state">
          <p>No videos found. Try a different search term.</p>
        </div>
      )}

      {downloading !== null && (
        <DownloadProgress progress={downloadProgress} />
      )}

      {showApiKeyModal && (
        <ApiKeyModal onSubmit={handleApiKeySubmit} />
      )}
    </div>
  );
}

export default StockVideoScreen;