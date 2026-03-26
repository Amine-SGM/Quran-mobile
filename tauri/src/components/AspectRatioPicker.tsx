import type { AspectRatio } from "../types";
import "./AspectRatioPicker.css";

interface AspectRatioPickerProps {
  value: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
}

interface RatioOption {
  value: AspectRatio;
  label: string;
  description: string;
  icon: string;
}

const RATIO_OPTIONS: RatioOption[] = [
  { value: "9:16", label: "9:16", description: "TikTok, Reels, Shorts", icon: "📱" },
  { value: "1:1", label: "1:1", description: "Instagram Square", icon: "⬜" },
  { value: "4:5", label: "4:5", description: "Instagram Portrait", icon: "📲" },
  { value: "16:9", label: "16:9", description: "YouTube Landscape", icon: "📺" },
];

export function AspectRatioPicker({
  value,
  onChange,
}: AspectRatioPickerProps) {
  return (
    <div className="aspect-ratio-picker">
      <label className="picker-label">Aspect Ratio</label>
      <div className="ratio-grid">
        {RATIO_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={`ratio-option ${value === option.value ? "selected" : ""}`}
            onClick={() => onChange(option.value)}
          >
            <span className="ratio-icon">{option.icon}</span>
            <span className="ratio-label">{option.label}</span>
            <span className="ratio-desc">{option.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default AspectRatioPicker;