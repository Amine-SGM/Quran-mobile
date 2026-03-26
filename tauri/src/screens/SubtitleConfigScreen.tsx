import { useState, useEffect } from "react";
import type { SubtitleConfig, AspectRatio, Resolution } from "../types";
import { FontSizeSlider } from "../components/FontSizeSlider";
import { ColorPicker } from "../components/ColorPicker";
import { ToggleSwitch } from "../components/ToggleSwitch";
import { VALIDATION, DEFAULT_SUBTITLE_CONFIG } from "../types";
import "./SubtitleConfigScreen.css";

interface SubtitleConfigScreenProps {
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  onBack: () => void;
  onContinue: (config: SubtitleConfig) => void;
}

export function SubtitleConfigScreen({
  surahNumber,
  ayahStart,
  ayahEnd,
  aspectRatio,
  resolution,
  onBack,
  onContinue,
}: SubtitleConfigScreenProps) {
  const [enabled, setEnabled] = useState(false);
  const [fontSize, setFontSize] = useState(DEFAULT_SUBTITLE_CONFIG.fontSize);
  const [color, setColor] = useState<"white" | "yellow">(DEFAULT_SUBTITLE_CONFIG.color);
  const [showTranslation, setShowTranslation] = useState(DEFAULT_SUBTITLE_CONFIG.showTranslation);
  const [translationFontSize, setTranslationFontSize] = useState(DEFAULT_SUBTITLE_CONFIG.translationFontSize);

  useEffect(() => {
    if (!enabled) {
      setShowTranslation(false);
    }
  }, [enabled]);

  const handleContinue = () => {
    const config: SubtitleConfig = {
      enabled,
      fontSize,
      color,
      position: "middle",
      showTranslation: enabled && showTranslation,
      translationFontSize,
    };
    onContinue(config);
  };

  return (
    <div className="subtitle-config-screen">
      <header className="config-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>Subtitle Settings</h1>
        <p className="selection-info">
          Surah {surahNumber}, Ayahs {ayahStart}-{ayahEnd} • {aspectRatio} @ {resolution}
        </p>
      </header>

      <div className="config-content">
        <section className="config-section">
          <ToggleSwitch
            label="Enable Arabic Subtitles"
            checked={enabled}
            onChange={setEnabled}
          />
        </section>

        {enabled && (
          <>
            <section className="config-section">
              <h3>Arabic Text</h3>
              <FontSizeSlider
                label="Font Size"
                value={fontSize}
                min={VALIDATION.SUBTITLE.FONT_SIZE_MIN}
                max={VALIDATION.SUBTITLE.FONT_SIZE_MAX}
                onChange={setFontSize}
              />
              <ColorPicker
                label="Text Color"
                value={color}
                onChange={setColor}
              />
            </section>

            <section className="config-section">
              <ToggleSwitch
                label="Show English Translation"
                checked={showTranslation}
                onChange={setShowTranslation}
              />

              {showTranslation && (
                <FontSizeSlider
                  label="Translation Font Size"
                  value={translationFontSize}
                  min={VALIDATION.SUBTITLE.TRANSLATION_FONT_SIZE_MIN}
                  max={VALIDATION.SUBTITLE.TRANSLATION_FONT_SIZE_MAX}
                  onChange={setTranslationFontSize}
                />
              )}
            </section>
          </>
        )}

        <section className="preview-section">
          <h3>Preview</h3>
          <div className={`preview-container aspect-${aspectRatio.replace(":", "x")}`}>
            <div className="preview-video-placeholder">
              <span>Video Preview</span>
            </div>
            {enabled && (
              <>
                <div className="preview-surah-title">
                  Surah Demo
                </div>
                <div className="preview-subtitle position-middle">
                  <span
                    className="preview-arabic"
                    style={{ fontSize: `${Math.min(fontSize / 2, 24)}px`, color }}
                  >
                    بِسْمِ اللَّهِ
                  </span>
                  {showTranslation && (
                    <span
                      className="preview-translation"
                      style={{ fontSize: `${Math.min(translationFontSize / 2, 12)}px`, color }}
                    >
                      In the name of Allah
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <div className="action-bar">
        <button className="continue-button" onClick={handleContinue}>
          Continue to Export →
        </button>
      </div>
    </div>
  );
}

export default SubtitleConfigScreen;