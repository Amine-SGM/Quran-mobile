import "./ShareButton.css";

interface ShareButtonProps {
  videoPath: string;
  disabled?: boolean;
}

export function ShareButton({ videoPath, disabled = false }: ShareButtonProps) {
  const handleShare = async () => {
    if (!videoPath) return;

    try {
      if (navigator.share) {
        const file = await fetch(videoPath);
        const blob = await file.blob();
        const fileObj = new File([blob], "quran_video.mp4", { type: "video/mp4" });

        await navigator.share({
          files: [fileObj],
          title: "Quran Short Video",
          text: "Check out this Quran recitation video!",
        });
      } else {
        alert("Sharing is not supported on this device. The video has been saved to your gallery.");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Share failed:", err);
        alert("Failed to share video. Please try again.");
      }
    }
  };

  return (
    <button
      className={`share-button ${disabled ? "disabled" : ""}`}
      onClick={handleShare}
      disabled={disabled || !videoPath}
    >
      <span className="share-icon">📤</span>
      <span className="share-label">Share Video</span>
    </button>
  );
}

export default ShareButton;