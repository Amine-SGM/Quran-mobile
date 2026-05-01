import { useState } from "react";
import "./ApiKeyModal.css";

interface ApiKeyModalProps {
  onSubmit: (keys: { pexels?: string; pixabay?: string }) => void;
  missingProviders?: string[];
}

export function ApiKeyModal({ onSubmit, missingProviders = [] }: ApiKeyModalProps) {
  const [pexelsKey, setPexelsKey] = useState("");
  const [pixabayKey, setPixabayKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const needsPexels = missingProviders.includes("Pexels");
    const needsPixabay = missingProviders.includes("Pixabay");
    const hasPexels = pexelsKey.trim().length > 0;
    const hasPixabay = pixabayKey.trim().length > 0;

    if (needsPexels && needsPixabay && !hasPexels && !hasPixabay) {
      setError("Please enter at least one API key");
      return;
    }

    if (needsPexels && !hasPexels && !needsPixabay) {
      setError("Please enter your Pexels API key");
      return;
    }

    if (needsPixabay && !hasPixabay && !needsPexels) {
      setError("Please enter your Pixabay API key");
      return;
    }

    if (hasPexels && pexelsKey.length < 20) {
      setError("Pexels API key appears to be invalid");
      return;
    }

    if (hasPixabay && pixabayKey.length < 20) {
      setError("Pixabay API key appears to be invalid");
      return;
    }

    onSubmit({
      pexels: needsPexels ? pexelsKey.trim() : undefined,
      pixabay: needsPixabay ? pixabayKey.trim() : undefined,
    });
  };

  return (
    <div className="api-key-modal-overlay">
      <div className="api-key-modal">
        <h2>API Keys Required</h2>
        <p className="modal-desc">
          To search for stock videos, please enter at least one API key.
          Your keys are stored securely on your device.
        </p>

        {missingProviders.includes("Pexels") && (
          <>
            <a
              href="https://www.pexels.com/api/new/"
              target="_blank"
              rel="noopener noreferrer"
              className="get-key-link"
            >
              Get a free Pexels API key →
            </a>

            <div className="input-group">
              <input
                type="password"
                placeholder="Enter your Pexels API key"
                value={pexelsKey}
                onChange={(e) => {
                  setPexelsKey(e.target.value);
                  setError(null);
                }}
              />
            </div>
          </>
        )}

        {missingProviders.includes("Pixabay") && (
          <>
            <a
              href="https://pixabay.com/api/docs/"
              target="_blank"
              rel="noopener noreferrer"
              className="get-key-link"
            >
              Get a free Pixabay API key →
            </a>

            <div className="input-group">
              <input
                type="password"
                placeholder="Enter your Pixabay API key"
                value={pixabayKey}
                onChange={(e) => {
                  setPixabayKey(e.target.value);
                  setError(null);
                }}
              />
            </div>
          </>
        )}

        {error && <span className="input-error">{error}</span>}

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
