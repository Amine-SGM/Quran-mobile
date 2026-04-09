import "./FontSizeSlider.css";

interface FontSizeSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function FontSizeSlider({
  label,
  value,
  min,
  max,
  onChange,
  disabled = false,
}: FontSizeSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`font-size-slider ${disabled ? "disabled" : ""}`}>
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">{value}px</span>
      </div>
      <div className="slider-track-container">
        <div className="slider-track">
          <div
            className="slider-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          disabled={disabled}
          className="slider-input"
        />
      </div>
      <div className="slider-labels">
        <span>{min}px</span>
        <span>{max}px</span>
      </div>
    </div>
  );
}

export default FontSizeSlider;