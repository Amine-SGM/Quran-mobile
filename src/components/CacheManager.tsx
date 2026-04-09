import "./CacheManager.css";

interface CacheStats {
  totalFiles: number;
  totalSizeBytes: number;
  oldestFileAgeSeconds: number | null;
  formattedSize: string;
}

interface CacheManagerProps {
  stats: CacheStats | null;
  loading: boolean;
  clearing: boolean;
  onClearCache: () => void;
  onRefresh: () => void;
}

export function CacheManager({
  stats,
  loading,
  clearing,
  onClearCache,
  onRefresh,
}: CacheManagerProps) {
  const formatAge = (seconds: number | null): string => {
    if (seconds === null) return "N/A";
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  return (
    <div className="cache-manager">
      <div className="cache-header">
        <h3>Cache</h3>
        <button
          className="refresh-button"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {stats && (
        <div className="cache-stats">
          <div className="stat-item">
            <span className="stat-label">Cached Files</span>
            <span className="stat-value">{stats.totalFiles}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Size</span>
            <span className="stat-value">{stats.formattedSize}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Oldest File Age</span>
            <span className="stat-value">
              {formatAge(stats.oldestFileAgeSeconds)}
            </span>
          </div>
        </div>
      )}

      <div className="cache-actions">
        <button
          className="clear-button"
          onClick={onClearCache}
          disabled={clearing || !stats?.totalFiles}
        >
          {clearing ? "Clearing..." : "Clear All Cache"}
        </button>
        <p className="cache-note">
          Audio, video, and subtitle files are cached temporarily.
          Files older than 3 hours are automatically cleaned.
        </p>
      </div>
    </div>
  );
}

export default CacheManager;