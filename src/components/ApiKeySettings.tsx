import { useState } from "react";
import "./ApiKeySettings.css";

interface ApiKeySettingsProps {
  isSet: boolean;
  label?: string;
  description?: string;
  docsUrl?: string;
  onSetKey: (key: string) => Promise<void>;
  onClearKey: () => Promise<void>;
}

export function ApiKeySettings({
  isSet,
  label = "API Key",
  description = "Required to search for stock videos.",
  docsUrl,
  onSetKey,
  onClearKey,
}: ApiKeySettingsProps) {
  const [showInput, setShowInput] = useState(false);
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!key.trim()) {
      setError("Please enter your API key");
      return;
    }

    if (key.length < 20) {
      setError("API key appears to be invalid");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSetKey(key.trim());
      setKey("");
      setShowInput(false);
    } catch (err) {
      setError(err as string);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (confirm(`Remove your ${label}?`)) {
      await onClearKey();
    }
  };

  return (
    <div className="api-key-settings">
      <div className="api-key-header">
        <h3>{label}</h3>
        <span className={`api-key-status ${isSet ? "set" : "not-set"}`}>
          {isSet ? "Configured" : "Not Set"}
        </span>
      </div>

      <p className="api-key-description">
        {description}{" "}
        {docsUrl && (
          <a href={docsUrl} target="_blank" rel="noopener noreferrer">
            {docsUrl}
          </a>
        )}
      </p>

      {isSet && !showInput ? (
        <div className="api-key-manage">
          <span className="api-key-masked">••••••••••••••••</span>
          <button className="change-key-button" onClick={() => setShowInput(true)}>
            Change Key
          </button>
          <button className="remove-key-button" onClick={handleClear}>
            Remove
          </button>
        </div>
      ) : (
        <div className="api-key-input-container">
          <div className="input-group">
            <input
              type="password"
              placeholder={`Enter your ${label}`}
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setError(null);
              }}
              disabled={saving}
            />
            {error && <span className="input-error">{error}</span>}
          </div>
          <div className="api-key-actions">
            <button
              className="save-button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            {isSet && (
              <button
                className="cancel-button"
                onClick={() => setShowInput(false)}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ApiKeySettings;
