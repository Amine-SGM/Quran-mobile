import { useState, useEffect } from "react";
import { useOutputSettings } from "../hooks/useOutputSettings";
import { AspectRatioPicker } from "../components/AspectRatioPicker";
import { ResolutionPicker } from "../components/ResolutionPicker";
import { FontSizeSlider } from "../components/FontSizeSlider";
import { ColorPicker } from "../components/ColorPicker";
import { ToggleSwitch } from "../components/ToggleSwitch";
import { PositionSelector } from "../components/PositionSelector";
import type { AspectRatio, Resolution, SubtitleConfig } from "../types";
import { VALIDATION, DEFAULT_SUBTITLE_CONFIG } from "../types";
import "./OutputSettingsScreen.css";

interface OutputSettingsScreenProps {
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
  reciterId: number;
  onBack: () => void;
  onContinue: (aspectRatio: AspectRatio, resolution: Resolution, subtitleConfig: SubtitleConfig) => void;
  initialAspectRatio?: AspectRatio;
  initialResolution?: Resolution;
  initialSubtitleConfig?: SubtitleConfig;
}

export function OutputSettingsScreen({
  surahNumber,
  ayahStart,
  ayahEnd,
  reciterId,
  onBack,
  onContinue,
  initialAspectRatio,
  initialResolution,
  initialSubtitleConfig,
}: OutputSettingsScreenProps) {
  const { settings, setAspectRatio, setResolution } = useOutputSettings({
    aspectRatio: initialAspectRatio,
    resolution: initialResolution,
  });

  // Subtitle States
  const [subtitleEnabled, setSubtitleEnabled] = useState(
    initialSubtitleConfig?.enabled ?? DEFAULT_SUBTITLE_CONFIG.enabled
  );
  const [fontSize, setFontSize] = useState(
    initialSubtitleConfig?.fontSize ?? DEFAULT_SUBTITLE_CONFIG.fontSize
  );
  const [color, setColor] = useState<"white" | "yellow">(
    initialSubtitleConfig?.color ?? DEFAULT_SUBTITLE_CONFIG.color
  );
  const [position, setPosition] = useState<"top" | "middle" | "bottom">(
    initialSubtitleConfig?.position ?? DEFAULT_SUBTITLE_CONFIG.position
  );
  const [showTranslation, setShowTranslation] = useState(
    initialSubtitleConfig?.showTranslation ?? DEFAULT_SUBTITLE_CONFIG.showTranslation
  );
  const [translationFontSize, setTranslationFontSize] = useState(
    initialSubtitleConfig?.translationFontSize ?? DEFAULT_SUBTITLE_CONFIG.translationFontSize
  );

  useEffect(() => {
    if (!subtitleEnabled) {
      setShowTranslation(false);
    }
  }, [subtitleEnabled]);

  const handleContinue = () => {
    const config: SubtitleConfig = {
      enabled: subtitleEnabled,
      fontSize,
      color,
      position,
      showTranslation: subtitleEnabled && showTranslation,
      translationFontSize,
    };
    onContinue(settings.aspectRatio, settings.resolution, config);
  };

  const safeAspectRatioClass = settings.aspectRatio ? settings.aspectRatio.replace(":", "x") : "9x16";

  return (
    <div className="output-settings-screen">
      <header className="settings-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>Video Configuration</h1>
        <p className="selection-info">
          Surah {surahNumber}, Ayahs {ayahStart}-{ayahEnd} • Reciter: {reciterId}
        </p>
      </header>

      <div className="settings-content">
        <section className="settings-section">
          <h3>Output Format</h3>
          <p className="settings-hint">
            Select the aspect ratio and resolution for your video.
          </p>
          <AspectRatioPicker
            value={settings.aspectRatio}
            onChange={setAspectRatio}
          />
          <ResolutionPicker
            value={settings.resolution}
            onChange={setResolution}
          />
        </section>

        <section className="settings-section">
          <div className="section-header-compact">
            <h3>Subtitles</h3>
            <ToggleSwitch
              label=""
              checked={subtitleEnabled}
              onChange={setSubtitleEnabled}
            />
          </div>

          {subtitleEnabled && (
            <div className="subtitle-options">
              <div className="option-group">
                <label className="picker-label">Arabic Text</label>
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
              </div>

              <PositionSelector
                label="Text Position"
                value={position}
                onChange={setPosition}
              />

              <div className="option-group">
                <ToggleSwitch
                  label="Show English Translation"
                  checked={showTranslation}
                  onChange={setShowTranslation}
                />

                {showTranslation && (
                  <FontSizeSlider
                    label="Translation Size"
                    value={translationFontSize}
                    min={VALIDATION.SUBTITLE.TRANSLATION_FONT_SIZE_MIN}
                    max={VALIDATION.SUBTITLE.TRANSLATION_FONT_SIZE_MAX}
                    onChange={setTranslationFontSize}
                  />
                )}
              </div>
            </div>
          )}
        </section>

        <section className="preview-section">
          <h3>Output Preview</h3>
          <div className={`preview-container aspect-${safeAspectRatioClass}`}>
            <div className="preview-video-placeholder">
              <span>Video Preview</span>
            </div>
            {subtitleEnabled && (
              <>
                <div className="preview-surah-title">
                  Surah Demo
                </div>
                <div className={`preview-subtitle position-${position}`}>
                  <span
                    className="preview-arabic"
                    style={{ fontSize: `${Math.min(fontSize / 3, 24)}px`, color }}
                  >
                    بِسْمِ اللَّهِ
                  </span>
                  {showTranslation && (
                    <span
                      className="preview-translation"
                      style={{ fontSize: `${Math.min(translationFontSize / 3, 12)}px`, color }}
                    >
                      In the name of Allah
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="preview-details">
            <span>{settings.aspectRatio} • {settings.resolution}</span>
            <span>{subtitleEnabled ? "Subtitles Enabled" : "No Subtitles"}</span>
          </div>
        </section>
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