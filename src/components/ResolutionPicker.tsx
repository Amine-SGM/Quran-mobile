import type { Resolution } from "../types";
import "./ResolutionPicker.css";

interface ResolutionPickerProps {
  value: Resolution;
  onChange: (res: Resolution) => void;
}

interface ResolutionOption {
  value: Resolution;
  label: string;
  description: string;
  pixels: string;
}

const RESOLUTION_OPTIONS: ResolutionOption[] = [
  {
    value: "720p",
    label: "720p",
    description: "Faster export",
    pixels: "1280×720",
  },
  {
    value: "1080p",
    label: "1080p",
    description: "Better quality",
    pixels: "1920×1080",
  },
];

export function ResolutionPicker({
  value,
  onChange,
}: ResolutionPickerProps) {
  return (
    <div className="resolution-picker">
      <label className="picker-label">Resolution</label>
      <div className="resolution-grid">
        {RESOLUTION_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={`resolution-option ${value === option.value ? "selected" : ""}`}
            onClick={() => onChange(option.value)}
          >
            <span className="res-label">{option.label}</span>
            <span className="res-pixels">{option.pixels}</span>
            <span className="res-desc">{option.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ResolutionPicker;