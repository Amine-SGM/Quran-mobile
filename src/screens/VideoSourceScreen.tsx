import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { AspectRatio, Resolution, VideoSource } from "../types";
import { VideoPicker } from "../components/VideoPicker";
import { VideoPreview } from "../components/VideoPreview";
import "./VideoSourceScreen.css";

interface VideoSourceScreenProps {
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
  reciterId: number;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  onBack: () => void;
  onContinue: (videoSource: VideoSource) => void;
  onStockVideo: () => void;
}

interface VideoFileInfo {
  path: string;
  width: number;
  height: number;
  duration: number;
  format: string;
}

export function VideoSourceScreen({
  surahNumber,
  ayahStart,
  ayahEnd,
  reciterId: _reciterId,
  aspectRatio,
  resolution,
  onBack,
  onContinue,
  onStockVideo,
}: VideoSourceScreenProps) {
  const [videoInfo, setVideoInfo] = useState<VideoFileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aspectRatioWarning, setAspectRatioWarning] = useState<string | null>(null);

  const handleVideoSelect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setAspectRatioWarning(null);

      const info: VideoFileInfo = await invoke("select_video_file");

      const warning = checkAspectRatio(info.width, info.height, aspectRatio);
      if (warning) {
        setAspectRatioWarning(warning);
      }

      setVideoInfo(info);
    } catch (err) {
      const errMsg = err as string;
      if (errMsg !== "CANCELLED") {
        setError(errMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (!videoInfo) return;

    const videoSource: VideoSource = {
      type: "upload",
      localPath: videoInfo.path,
      stockVideoId: null,
      stockVideoUrl: null,
      width: videoInfo.width,
      height: videoInfo.height,
      duration: videoInfo.duration,
    };

    onContinue(videoSource);
  };

  return (
    <div className="video-source-screen">
      <header className="source-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>Select Video Source</h1>
        <p className="selection-info">
          Surah {surahNumber}, Ayahs {ayahStart}-{ayahEnd} • {aspectRatio} @ {resolution}
        </p>
      </header>

      <div className="source-options">
        <div className="option-section">
          <h2>Upload Video</h2>
          <p className="option-desc">
            Select a video from your device
          </p>
          <VideoPicker onSelect={handleVideoSelect} isLoading={isLoading} />
        </div>

        <div className="divider">
          <span>OR</span>
        </div>

        <div className="option-section">
          <h2>Stock Video</h2>
          <p className="option-desc">
            Search Pexels for free stock videos (filtered by {aspectRatio})
          </p>
          <button className="stock-button" onClick={onStockVideo}>
            Browse Stock Videos
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {aspectRatioWarning && (
        <div className="warning-message">
          <p>⚠️ {aspectRatioWarning}</p>
        </div>
      )}

      {videoInfo && (
        <div className="video-preview-section">
          <h3>Selected Video</h3>
          <VideoPreview videoInfo={videoInfo} />
        </div>
      )}

      {videoInfo && (
        <div className="action-bar">
          <button className="continue-button" onClick={handleContinue}>
            Continue to Subtitle Settings →
          </button>
        </div>
      )}
    </div>
  );
}

function checkAspectRatio(
  videoWidth: number,
  videoHeight: number,
  targetRatio: AspectRatio
): string | null {
  const videoRatio = videoWidth / videoHeight;

  const targetRatios: Record<AspectRatio, number> = {
    "9:16": 9 / 16,
    "1:1": 1,
    "4:5": 4 / 5,
    "16:9": 16 / 9,
  };

  const target = targetRatios[targetRatio];
  const diff = Math.abs(videoRatio - target) / target;

  if (diff > 0.1) {
    const videoOrientation = videoWidth > videoHeight ? "landscape" : "portrait";
    const targetOrientation =
      targetRatio === "16:9"
        ? "landscape"
        : targetRatio === "1:1"
        ? "square"
        : "portrait";

    if (videoOrientation !== targetOrientation) {
      return `Video is ${videoOrientation} but output is set to ${targetOrientation} (${targetRatio}). Video will be cropped or letterboxed.`;
    }
  }

  return null;
}

export default VideoSourceScreen;