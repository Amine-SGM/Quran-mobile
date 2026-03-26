import "./DownloadProgress.css";

interface DownloadProgressProps {
  progress: number;
}

export function DownloadProgress({ progress }: DownloadProgressProps) {
  return (
    <div className="download-progress-overlay">
      <div className="download-progress-modal">
        <h3>Downloading Video</h3>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <span className="progress-text">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

export default DownloadProgress;