import { useOutputSettings } from "../hooks/useOutputSettings";
import { AspectRatioPicker } from "../components/AspectRatioPicker";
import { ResolutionPicker } from "../components/ResolutionPicker";
import type { AspectRatio, Resolution } from "../types";
import "./OutputSettingsScreen.css";

interface OutputSettingsScreenProps {
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
  reciterId: number;
  onBack: () => void;
  onContinue: (aspectRatio: AspectRatio, resolution: Resolution) => void;
}

export function OutputSettingsScreen({
  surahNumber,
  ayahStart,
  ayahEnd,
  reciterId,
  onBack,
  onContinue,
}: OutputSettingsScreenProps) {
  const { settings, setAspectRatio, setResolution } = useOutputSettings();

  const handleContinue = () => {
    onContinue(settings.aspectRatio, settings.resolution);
  };

  return (
    <div className="output-settings-screen">
      <header className="settings-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>Output Settings</h1>
        <p className="selection-info">
          Surah {surahNumber}, Ayahs {ayahStart}-{ayahEnd} • Reciter: {reciterId}
        </p>
      </header>

      <div className="settings-content">
        <div className="settings-card">
          <p className="settings-hint">
            Configure aspect ratio and resolution before selecting your video. This ensures
            optimal video selection and avoids unnecessary re-encoding.
          </p>

          <AspectRatioPicker
            value={settings.aspectRatio}
            onChange={setAspectRatio}
          />

          <ResolutionPicker
            value={settings.resolution}
            onChange={setResolution}
          />
        </div>

        <div className="preview-card">
          <h3>Output Preview</h3>
          <div className="preview-info">
            <div className="preview-row">
              <span className="preview-label">Aspect Ratio</span>
              <span className="preview-value">{settings.aspectRatio}</span>
            </div>
            <div className="preview-row">
              <span className="preview-label">Resolution</span>
              <span className="preview-value">{settings.resolution}</span>
            </div>
            <div className="preview-row">
              <span className="preview-label">Orientation</span>
              <span className="preview-value">
                {settings.aspectRatio === "16:9"
                  ? "Landscape"
                  : settings.aspectRatio === "1:1"
                  ? "Square"
                  : "Portrait"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="action-bar">
        <button className="continue-button" onClick={handleContinue}>
          Continue to Video Selection →
        </button>
      </div>
    </div>
  );
}

export default OutputSettingsScreen;