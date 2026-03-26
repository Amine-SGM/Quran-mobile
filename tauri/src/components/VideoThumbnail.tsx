import type { PexelsVideo } from "../types";
import "./VideoThumbnail.css";

interface VideoThumbnailProps {
  video: PexelsVideo;
  onSelect: () => void;
  isLoading: boolean;
}

export function VideoThumbnail({
  video,
  onSelect,
  isLoading,
}: VideoThumbnailProps) {
  const thumbnail = video.videoPictures[0]?.picture;
  const duration = formatDuration(video.duration);

  return (
    <div
      className={`video-thumbnail ${isLoading ? "loading" : ""}`}
      onClick={isLoading ? undefined : onSelect}
    >
      <div className="thumbnail-image">
        {thumbnail ? (
          <img src={thumbnail} alt={`Video by ${video.userName}`} />
        ) : (
          <div className="placeholder">No preview</div>
        )}
        <div className="play-overlay">
          <span className="play-icon">▶</span>
        </div>
        <span className="duration-badge">{duration}</span>
      </div>

      <div className="thumbnail-info">
        <span className="video-user">{video.userName}</span>
        <span className="video-dimensions">
          {video.width}×{video.height}
        </span>
      </div>

      {isLoading && (
        <div className="loading-overlay">
          <span className="loading-text">Downloading...</span>
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default VideoThumbnail;