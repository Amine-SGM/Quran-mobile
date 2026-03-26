import "./VideoPicker.css";

interface VideoPickerProps {
  onSelect: () => void;
  isLoading: boolean;
}

export function VideoPicker({ onSelect, isLoading }: VideoPickerProps) {
  return (
    <button
      className={`video-picker ${isLoading ? "loading" : ""}`}
      onClick={onSelect}
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="loading-text">Opening file picker...</span>
      ) : (
        <>
          <span className="picker-icon">📁</span>
          <span className="picker-text">Select Video File</span>
          <span className="picker-hint">MP4, MOV, AVI, MKV, WebM</span>
        </>
      )}
    </button>
  );
}

export default VideoPicker;