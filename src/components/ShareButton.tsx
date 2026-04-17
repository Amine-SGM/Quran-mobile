import { invoke } from "@tauri-apps/api/core";
import "./ShareButton.css";

interface ShareButtonProps {
  videoPath: string;
  disabled?: boolean;
}

export function ShareButton({ videoPath, disabled = false }: ShareButtonProps) {
  const handleSaveToGallery = async () => {
    if (!videoPath) return;

    try {
      await invoke("save_to_gallery", { path: videoPath });
      alert("Video saved to gallery!");
    } catch (err) {
      console.error("Save to gallery failed:", err);
      alert("Failed to save video to gallery.");
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
        className={`share-button save-button ${disabled ? "disabled" : ""}`}
        onClick={handleSaveToGallery}
        disabled={disabled || !videoPath}
      >
        <span className="share-icon">💾</span>
        <span className="share-label">Save to Gallery</span>
      </button>
    </div>
  );
}

export default ShareButton;