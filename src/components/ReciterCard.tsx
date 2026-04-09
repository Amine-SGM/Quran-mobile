import type { Reciter } from "../types";
import "./ReciterCard.css";

interface ReciterCardProps {
  reciter: Reciter;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onPlayPreview: () => void;
}

export function ReciterCard({
  reciter,
  isSelected,
  isPlaying,
  onSelect,
  onPlayPreview,
}: ReciterCardProps) {
  return (
    <div
      className={`reciter-card ${isSelected ? "selected" : ""}`}
      onClick={onSelect}
    >
      <div className="reciter-info">
        <span className="reciter-name">{reciter.name}</span>
        {reciter.style && (
          <span className="reciter-style">{reciter.style}</span>
        )}
      </div>

      <button
        className={`preview-button ${isPlaying ? "playing" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onPlayPreview();
        }}
      >
        {isPlaying ? "⏹" : "▶"}
      </button>

      {isSelected && <div className="selected-indicator">✓</div>}
    </div>
  );
}

export default ReciterCard;
