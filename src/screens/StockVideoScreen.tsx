import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type {
  AspectRatio,
  Resolution,
  PexelsVideo,
  PixabayVideo,
  SearchPexelsResponse,
  SearchPixabayResponse,
  StockVideoItem,
  StockVideoProvider,
  VideoSource,
} from "../types";
import { VideoThumbnail } from "../components/VideoThumbnail";
import { ApiKeyModal } from "../components/ApiKeyModal";
import { DownloadProgress } from "../components/DownloadProgress";
import { ToggleSwitch } from "../components/ToggleSwitch";
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
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");
  const [allVideos, setAllVideos] = useState<StockVideoItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [providerFilter, setProviderFilter] = useState<"all" | StockVideoProvider>("all");
  const [aiOnly, setAiOnly] = useState(false);
  const [missingKeys, setMissingKeys] = useState<string[]>([]);

  useEffect(() => {
    void initializeSearch();
  }, []);


  async function initializeSearch() {
    await checkApiKeys();
    await handleSearch();
  }

  async function checkApiKeys() {
    try {
      const settings = await invoke<{
        pexels_api_key_set: boolean;
        pixabay_api_key_set: boolean;
      }>("get_settings");

      const missing: string[] = [];
      if (!settings.pexels_api_key_set) missing.push("Pexels");
      if (!settings.pixabay_api_key_set) missing.push("Pixabay");

      setMissingKeys(missing);
      setShowApiKeyModal(missing.length === 2);
    } catch (err) {
      console.error("Failed to check API key:", err);
    }
  }

  async function handleSearch() {
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const effectiveQuery = query.trim();
      const resolutionsToTry = getResolutionFallbacks(resolution);
      let lastMerged: StockVideoItem[] = [];
      let lastErrors: string[] = [];

      for (const resolutionToTry of resolutionsToTry) {
        const [
          { result: pexelsResult, error: pexelsError },
          { result: pixabayResult, error: pixabayError },
        ] = await Promise.all([
          safeInvoke<SearchPexelsResponse>("search_pexels_videos", {
            query: effectiveQuery,
            aspectRatio,
            resolution: resolutionToTry,
            perPage: 20,
          }),
          safeInvoke<SearchPixabayResponse>("search_pixabay_videos", {
            query: effectiveQuery,
            aspectRatio,
            resolution: resolutionToTry,
            perPage: 20,
          }),
        ]);

        const pexelsVideos = pexelsResult?.videos ?? [];
        const pixabayVideos = pixabayResult?.videos ?? [];
        const errors = [pexelsError, pixabayError].filter((msg): msg is string => !!msg);

        if (errors.some((msg) => msg === "API_KEY_NOT_SET" || msg === "PIXABAY_API_KEY_NOT_SET")) {
          await checkApiKeys();
        }

        const merged = mergeResults(pexelsVideos, pixabayVideos, resolutionToTry, aspectRatio);
        lastMerged = merged;
        lastErrors = errors;

        if (merged.length > 0) {
          setAllVideos(merged);
          setLastSearchedQuery(effectiveQuery);
          return;
        }
      }

      setAllVideos(lastMerged);
      setLastSearchedQuery(effectiveQuery);


      if (lastErrors.length > 0) {
        setError(lastErrors.map((msg) => normalizeSearchError(msg)).join(" | "));
      }
    } catch (err) {
      const errMsg = err as string;
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectVideo(video: StockVideoItem) {
    const bestFile = selectBestFile(video);

    if (!bestFile) {
      setError("No suitable video file found");
      return;
    }

    try {
      setDownloading(getDownloadKey(video));
      setDownloadProgress(0);

      const response: StockVideoResponse = await invoke("download_stock_video", {
        videoId: video.id,
        videoUrl: bestFile.link,
        provider: video.provider,
      });

      const videoSource: VideoSource = {
        type: "stock",
        localPath: null,
        stockVideoId: video.id,
        stockVideoUrl: bestFile.link,
        stockVideoProvider: video.provider,
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

  const handleApiKeySubmit = async (keys: { pexels?: string; pixabay?: string }) => {
    const params: Record<string, string> = {};
    if (keys.pexels) {
      params.pexels_api_key = keys.pexels;
    }
    if (keys.pixabay) {
      params.pixabay_api_key = keys.pixabay;
    }

    await invoke("set_settings", { params });
    setShowApiKeyModal(false);
    await checkApiKeys();
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
          Surah {surahNumber}, Ayahs {ayahStart}-{ayahEnd} • {aspectRatio}
        </p>
      </header>

      <div className="search-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search stock videos..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim() !== lastSearchedQuery) {
                setLastSearchedQuery("");
              }
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button onClick={handleSearch} disabled={loading}>
            {loading ? "Searching..." : lastSearchedQuery ? "Refresh" : "Search"}
          </button>
        </div>
        <div className="search-filters">
          <div className="provider-filters" role="group" aria-label="Video provider filter">
            <button
              type="button"
              className={providerFilter === "all" ? "active" : ""}
              onClick={() => setProviderFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              className={providerFilter === "pexels" ? "active" : ""}
              onClick={() => setProviderFilter("pexels")}
            >
              Pexels
            </button>
            <button
              type="button"
              className={providerFilter === "pixabay" ? "active" : ""}
              onClick={() => setProviderFilter("pixabay")}
            >
              Pixabay
            </button>
          </div>
          <ToggleSwitch
            label="AI-generated only"
            checked={aiOnly}
            onChange={(checked) => {
              setAiOnly(checked);
            }}
          />
        </div>
      </div>


      {missingKeys.length === 1 && (
        <div className="notice-message">
          {missingKeys[0]} API key not set. Showing results from the other provider.
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="video-grid" data-ratio={aspectRatio}>
        {filterVisibleResults(allVideos, providerFilter, aiOnly).map((video) => (
          <VideoThumbnail
            key={`${video.provider}-${video.id}`}
            video={video}
            onSelect={() => handleSelectVideo(video)}
            isLoading={downloading === getDownloadKey(video)}
          />
        ))}
      </div>

      {filterVisibleResults(allVideos, providerFilter, aiOnly).length === 0 && !loading && query && (
        <div className="empty-state">
          <p>No videos found. Try a different search term.</p>
        </div>
      )}


      {downloading !== null && (
        <DownloadProgress progress={downloadProgress} />
      )}

      {showApiKeyModal && (
        <ApiKeyModal onSubmit={handleApiKeySubmit} missingProviders={missingKeys} />
      )}
    </div>
  );
}

function matchesAspectRatio(
  width: number,
  height: number,
  target: AspectRatio
): boolean {
  if (width <= 0 || height <= 0) return true;
  const actual = width / height;
  const targets: Record<AspectRatio, number> = {
    "9:16": 9 / 16,
    "4:5": 4 / 5,
    "1:1": 1,
    "16:9": 16 / 9,
  };
  const expected = targets[target];
  return Math.abs(actual - expected) / expected <= 0.1;
}

function mergeResults(
  pexels: PexelsVideo[],
  pixabay: PixabayVideo[],
  matchedResolution: Resolution,
  aspectRatio: AspectRatio
): StockVideoItem[] {
  const mappedPexels: StockVideoItem[] = pexels.flatMap((video) => {
    const bestFile = selectPexelsFile(video.videoFiles, matchedResolution);
    if (!bestFile) return [];

    return [{
      provider: "pexels",
      id: video.id,
      userName: video.userName,
      duration: video.duration,
      width: bestFile.width,
      height: bestFile.height,
      matchedResolution,
      previewUrl: video.videoPictures[0]?.picture ?? null,
      videoFiles: video.videoFiles,
      isAiGenerated: false,
    }];
  });

  const mappedPixabay: StockVideoItem[] = pixabay.flatMap((video) => {
    const bestFile = selectPixabayFile(video.videoFiles, matchedResolution);
    if (!bestFile) return [];

    return [{
      provider: "pixabay",
      id: video.id,
      userName: video.userName,
      duration: video.duration,
      width: bestFile.width,
      height: bestFile.height,
      matchedResolution,
      previewUrl: bestFile.thumbnail || video.previewUrl || null,
      videoFiles: video.videoFiles,
      isAiGenerated: video.isAiGenerated,
    }];
  });

  const combined = [
    ...mappedPexels.filter((video) => matchesAspectRatio(video.width, video.height, aspectRatio)),
    ...mappedPixabay,
  ];

  return combined.sort((a, b) => b.width * b.height - a.width * a.height);
}

function filterVisibleResults(
  videos: StockVideoItem[],
  providerFilter: "all" | StockVideoProvider,
  aiOnly: boolean
) {
  return videos.filter((video) => {
    if (providerFilter !== "all" && video.provider !== providerFilter) {
      return false;
    }

    if (aiOnly) {
      return video.provider === "pixabay" && video.isAiGenerated;
    }

    return true;
  });
}


function selectBestFile(video: StockVideoItem) {
  if (video.provider === "pexels") {
    return selectPexelsFile(video.videoFiles, video.matchedResolution);
  }

  return selectPixabayFile(video.videoFiles, video.matchedResolution);
}

function selectPexelsFile(
  files: PexelsVideo["videoFiles"],
  matchedResolution: Resolution
) {
  const cap = matchedResolution === "720p" ? 1280 * 720 : 1920 * 1080;
  const sorted = [...files]
    .filter((file) => file.fileType === "video/mp4")
    .sort((a, b) => a.width * a.height - b.width * b.height);

  const capped = sorted.filter((file) => file.width * file.height <= cap);
  return capped[capped.length - 1] ?? sorted[sorted.length - 1] ?? null;
}

function selectPixabayFile(
  files: PixabayVideo["videoFiles"],
  matchedResolution: Resolution
) {
  const cap = matchedResolution === "720p" ? 1280 * 720 : 1920 * 1080;
  const sorted = [...files].sort((a, b) => a.width * a.height - b.width * b.height);
  const capped = sorted.filter((file) => file.width * file.height <= cap);
  return capped[capped.length - 1] ?? sorted[sorted.length - 1] ?? null;
}

function getDownloadKey(video: StockVideoItem) {
  return `${video.provider}-${video.id}`;
}

function getResolutionFallbacks(preferred: Resolution): Resolution[] {
  return preferred === "720p" ? ["720p", "1080p"] : ["1080p"];
}

function normalizeSearchError(error: string) {
  if (error === "API_KEY_NOT_SET") {
    return "Pexels API key not set";
  }

  if (error === "PIXABAY_API_KEY_NOT_SET") {
    return "Pixabay API key not set";
  }

  return error;
}

async function safeInvoke<T>(command: string, payload: Record<string, unknown>) {
  try {
    const result = await invoke<T>(command, payload);
    return { result, error: null } as { result: T; error: null };
  } catch (err) {
    return { result: null, error: err as string } as { result: null; error: string };
  }
}

export default StockVideoScreen;
