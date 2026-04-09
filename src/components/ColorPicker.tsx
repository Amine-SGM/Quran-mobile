import "./ColorPicker.css";

interface ColorPickerProps {
  label: string;
  value: "white" | "yellow";
  onChange: (color: "white" | "yellow") => void;
  disabled?: boolean;
}

const COLORS: Array<{ id: "white" | "yellow"; label: string; preview: string }> = [
  { id: "white", label: "White", preview: "#ffffff" },
  { id: "yellow", label: "Yellow", preview: "#fbbf24" },
];

export function ColorPicker({
  label,
  value,
  onChange,
  disabled = false,
}: ColorPickerProps) {
  return (
    <div className={`color-picker ${disabled ? "disabled" : ""}`}>
      <span className="picker-label">{label}</span>
      <div className="color-options">
        {COLORS.map((color) => (
          <button
            key={color.id}
            className={`color-option ${value === color.id ? "selected" : ""}`}
            onClick={() => onChange(color.id)}
            disabled={disabled}
          >
            <span
              className="color-preview"
              style={{ backgroundColor: color.preview }}
            />
            <span className="color-label">{color.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ColorPicker;