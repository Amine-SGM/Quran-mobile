import { useState } from "react";
import "./ApiKeyModal.css";

interface ApiKeyModalProps {
  onSubmit: (key: string) => void;
}

export function ApiKeyModal({ onSubmit }: ApiKeyModalProps) {
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!key.trim()) {
      setError("Please enter your Pexels API key");
      return;
    }

    if (key.length < 20) {
      setError("API key appears to be invalid");
      return;
    }

    onSubmit(key.trim());
  };

  return (
    <div className="api-key-modal-overlay">
      <div className="api-key-modal">
        <h2>Pexels API Key Required</h2>
        <p className="modal-desc">
          To search for stock videos, please enter your Pexels API key. 
          Your key will be stored securely on your device.
        </p>

        <a
          href="https://www.pexels.com/api/new/"
          target="_blank"
          rel="noopener noreferrer"
          className="get-key-link"
        >
          Get a free API key at pexels.com →
        </a>

        <div className="input-group">
          <input
            type="password"
            placeholder="Enter your Pexels API key"
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setError(null);
            }}
          />
          {error && <span className="input-error">{error}</span>}
        </div>

        <div className="modal-actions">
          <button className="submit-button" onClick={handleSubmit}>
            Save & Continue
          </button>
        </div>

        <p className="privacy-note">
          Your API key is stored locally and never sent to our servers.
        </p>
      </div>
    </div>
  );
}

export default ApiKeyModal;