import "./ToggleSwitch.css";

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function ToggleSwitch({
  label,
  checked,
  onChange,
  disabled = false,
}: ToggleSwitchProps) {
  return (
    <div className={`toggle-switch ${disabled ? "disabled" : ""}`}>
      <span className="toggle-label">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`toggle-track ${checked ? "checked" : ""}`}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
      >
        <span className={`toggle-thumb ${checked ? "checked" : ""}`} />
      </button>
    </div>
  );
}

export default ToggleSwitch;