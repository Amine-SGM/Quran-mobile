import { invoke } from "@tauri-apps/api/core";
import { openPath } from "@tauri-apps/plugin-opener";
import "./ShareButton.css";

interface ShareButtonProps {
  videoPath: string;
  disabled?: boolean;
}

export function ShareButton({ videoPath, disabled = false }: ShareButtonProps) {
  const handlePlayVideo = async () => {
    if (!videoPath) return;

    try {
      await openPath(videoPath);
    } catch (err) {
      console.error("Play video failed:", err);
      alert("Failed to play video.");
    }
  };

  const handleShare = async () => {
    if (!videoPath) return;

    try {
      await invoke("share_video", { path: videoPath });
    } catch (err) {
      console.error("Share failed:", err);
      alert("Failed to share video.");
    }
  };

  return (
    <div className="share-button-group">
      <button
        className={`share-button ${disabled ? "disabled" : ""}`}
        onClick={handleShare}
        disabled={disabled || !videoPath}
      >
        <span className="share-icon">📤</span>
        <span className="share-label">Share Video</span>
      </button>
      <button
        className={`share-button play-button ${disabled ? "disabled" : ""}`}
        onClick={handlePlayVideo}
        disabled={disabled || !videoPath}
      >
        <span className="share-icon">▶️</span>
        <span className="share-label">Play Video</span>
      </button>
    </div>
  );
}

export default ShareButton;