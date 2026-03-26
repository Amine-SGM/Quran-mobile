import "./PositionSelector.css";

interface PositionSelectorProps {
  label: string;
  value: "top" | "middle" | "bottom";
  onChange: (position: "top" | "middle" | "bottom") => void;
  disabled?: boolean;
}

const POSITIONS: Array<{
  id: "top" | "middle" | "bottom";
  label: string;
  icon: string;
}> = [
  { id: "top", label: "Top", icon: "↑" },
  { id: "middle", label: "Middle", icon: "•" },
  { id: "bottom", label: "Bottom", icon: "↓" },
];

export function PositionSelector({
  label,
  value,
  onChange,
  disabled = false,
}: PositionSelectorProps) {
  return (
    <div className={`position-selector ${disabled ? "disabled" : ""}`}>
      <span className="picker-label">{label}</span>
      <div className="position-options">
        {POSITIONS.map((pos) => (
          <button
            key={pos.id}
            className={`position-option ${value === pos.id ? "selected" : ""}`}
            onClick={() => onChange(pos.id)}
            disabled={disabled}
          >
            <span className="position-icon">{pos.icon}</span>
            <span className="position-label">{pos.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default PositionSelector;