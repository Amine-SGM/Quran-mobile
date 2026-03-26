import "./VideoPreview.css";

interface VideoPreviewProps {
  videoInfo: {
    path: string;
    width: number;
    height: number;
    duration: number;
    format: string;
  };
}

export function VideoPreview({ videoInfo }: VideoPreviewProps) {
  const fileName = videoInfo.path.split(/[/\\]/).pop() || videoInfo.path;
  const durationFormatted = formatDuration(videoInfo.duration);
  const aspectRatio = calculateAspectRatio(videoInfo.width, videoInfo.height);

  return (
    <div className="video-preview">
      <div className="preview-thumbnail">
        <span className="play-icon">▶</span>
        <span className="duration-badge">{durationFormatted}</span>
      </div>

      <div className="preview-details">
        <div className="preview-row">
          <span className="label">File</span>
          <span className="value filename">{fileName}</span>
        </div>
        <div className="preview-row">
          <span className="label">Resolution</span>
          <span className="value">{videoInfo.width}×{videoInfo.height}</span>
        </div>
        <div className="preview-row">
          <span className="label">Aspect Ratio</span>
          <span className="value">{aspectRatio}</span>
        </div>
        <div className="preview-row">
          <span className="label">Duration</span>
          <span className="value">{durationFormatted}</span>
        </div>
        <div className="preview-row">
          <span className="label">Format</span>
          <span className="value">{videoInfo.format.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function calculateAspectRatio(width: number, height: number): string {
  const ratio = width / height;

  if (Math.abs(ratio - 16 / 9) < 0.1) return "16:9";
  if (Math.abs(ratio - 9 / 16) < 0.1) return "9:16";
  if (Math.abs(ratio - 4 / 5) < 0.1) return "4:5";
  if (Math.abs(ratio - 1) < 0.05) return "1:1";
  if (Math.abs(ratio - 4 / 3) < 0.1) return "4:3";

  return `${width}:${height}`;
}

export default VideoPreview;