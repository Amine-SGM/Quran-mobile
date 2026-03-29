import { useState, useEffect } from "react";
import { useOutputSettings } from "../hooks/useOutputSettings";
import { AspectRatioPicker } from "../components/AspectRatioPicker";
import { ResolutionPicker } from "../components/ResolutionPicker";
import { FontSizeSlider } from "../components/FontSizeSlider";

import { ToggleSwitch } from "../components/ToggleSwitch";

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
  const [arabicColor, setArabicColor] = useState<string>(
    initialSubtitleConfig?.arabicColor ?? DEFAULT_SUBTITLE_CONFIG.arabicColor
  );
  const [translationColor, setTranslationColor] = useState<string>(
    initialSubtitleConfig?.translationColor ?? DEFAULT_SUBTITLE_CONFIG.translationColor
  );
  const [position] = useState<"top" | "middle" | "bottom">(
    "middle"
  );
  const [showTranslation, setShowTranslation] = useState(
    initialSubtitleConfig?.showTranslation ?? DEFAULT_SUBTITLE_CONFIG.showTranslation
  );
  const [translationFontSize, setTranslationFontSize] = useState(
    initialSubtitleConfig?.translationFontSize ?? DEFAULT_SUBTITLE_CONFIG.translationFontSize
  );
  const [customText, setCustomText] = useState(
    initialSubtitleConfig?.customText ?? DEFAULT_SUBTITLE_CONFIG.customText
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
      arabicColor,
      translationColor,
      position,
      showTranslation: subtitleEnabled && showTranslation,
      translationFontSize,
      customText,
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
          <span className="surah-gradient">Surah {surahNumber}</span>, Ayahs {ayahStart}-{ayahEnd} • Reciter: {reciterId}
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
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ width: '70%', flexShrink: 0 }}>
                    <FontSizeSlider
                      label="Font Size"
                      value={fontSize}
                      min={VALIDATION.SUBTITLE.FONT_SIZE_MIN}
                      max={VALIDATION.SUBTITLE.FONT_SIZE_MAX}
                      onChange={setFontSize}
                    />
                  </div>
                  <div style={{ width: '30%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '-12px' }}>
                    <button
                      onClick={() => setArabicColor('#FFFFFF')}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#FFFFFF',
                        border: arabicColor === '#FFFFFF' ? '2px solid #D4AF37' : '2px solid rgba(255, 255, 255, 0.2)',
                        cursor: 'pointer',
                        padding: 0,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        flexShrink: 0
                      }}
                      title="White"
                    />
                    <div style={{
                      position: 'relative',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: arabicColor !== '#FFFFFF' ? '2px solid #D4AF37' : '2px solid rgba(255, 255, 255, 0.2)',
                      background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      flexShrink: 0
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: arabicColor !== '#FFFFFF' ? arabicColor : 'transparent',
                        pointerEvents: 'none',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
                      }} />
                      <input 
                        type="color" 
                        value={arabicColor !== '#FFFFFF' ? arabicColor : '#ff0000'} 
                        onChange={(e) => setArabicColor(e.target.value.toUpperCase())} 
                        style={{ 
                          position: 'absolute',
                          top: '-10px',
                          left: '-10px',
                          width: '60px', 
                          height: '60px', 
                          padding: '0', 
                          border: 'none', 
                          cursor: 'pointer', 
                          opacity: 0
                        }} 
                      />
                    </div>
                  </div>
                </div>
              </div>



              <div className="option-group">
                <ToggleSwitch
                  label="Show English Translation"
                  checked={showTranslation}
                  onChange={setShowTranslation}
                />

                {showTranslation && (
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ width: '70%', flexShrink: 0 }}>
                      <FontSizeSlider
                        label="Translation Size"
                        value={translationFontSize}
                        min={VALIDATION.SUBTITLE.TRANSLATION_FONT_SIZE_MIN}
                        max={VALIDATION.SUBTITLE.TRANSLATION_FONT_SIZE_MAX}
                        onChange={setTranslationFontSize}
                      />
                    </div>
                    <div style={{ width: '30%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '-12px' }}>
                      <button
                        onClick={() => setTranslationColor('#FFFFFF')}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#FFFFFF',
                          border: translationColor === '#FFFFFF' ? '2px solid #D4AF37' : '2px solid rgba(255, 255, 255, 0.2)',
                          cursor: 'pointer',
                          padding: 0,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                          flexShrink: 0
                        }}
                        title="White"
                      />
                      <div style={{
                        position: 'relative',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: translationColor !== '#FFFFFF' ? '2px solid #D4AF37' : '2px solid rgba(255, 255, 255, 0.2)',
                        background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        flexShrink: 0
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: translationColor !== '#FFFFFF' ? translationColor : 'transparent',
                          pointerEvents: 'none',
                          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
                        }} />
                        <input 
                          type="color" 
                          value={translationColor !== '#FFFFFF' ? translationColor : '#ff0000'} 
                          onChange={(e) => setTranslationColor(e.target.value.toUpperCase())} 
                          style={{ 
                            position: 'absolute',
                            top: '-10px',
                            left: '-10px',
                            width: '60px', 
                            height: '60px', 
                            padding: '0', 
                            border: 'none', 
                            cursor: 'pointer', 
                            opacity: 0
                          }} 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="option-group" style={{ marginTop: '16px' }}>
                <label className="picker-label">Custom Bottom Text</label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="E.g. @QuranMobile"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    background: '#1A1A1A',
                    color: '#FFF',
                    fontSize: '14px',
                  }}
                />
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
                    style={{ fontSize: `${Math.min(fontSize / 3, 24)}px`, color: arabicColor }}
                  >
                    بِسْمِ اللَّهِ
                  </span>
                  {showTranslation && (
                    <span
                      className="preview-translation"
                      style={{ fontSize: `${Math.min(translationFontSize / 3, 12)}px`, color: translationColor }}
                    >
                      In the name of Allah
                    </span>
                  )}
                  {customText && (
                    <span
                      className="preview-custom-text"
                      style={{ fontSize: '10px', color: '#FFFFFF', position: 'absolute', bottom: '20px', left: '0', right: '0', textAlign: 'center' }}
                    >
                      {customText}
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