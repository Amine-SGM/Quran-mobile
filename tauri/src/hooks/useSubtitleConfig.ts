import { useState, useCallback } from "react";
import type { SubtitleConfig } from "../types";
import { DEFAULT_SUBTITLE_CONFIG, VALIDATION } from "../types";

interface UseSubtitleConfigReturn {
  config: SubtitleConfig;
  setEnabled: (enabled: boolean) => void;
  setFontSize: (fontSize: number) => void;
  setColor: (color: "white" | "yellow") => void;
  setPosition: (position: "top" | "middle" | "bottom") => void;
  setShowTranslation: (show: boolean) => void;
  setTranslationFontSize: (fontSize: number) => void;
  reset: () => void;
  setConfig: (config: SubtitleConfig) => void;
}

export function useSubtitleConfig(
  initialConfig?: Partial<SubtitleConfig>
): UseSubtitleConfigReturn {
  const [config, setConfigState] = useState<SubtitleConfig>({
    ...DEFAULT_SUBTITLE_CONFIG,
    ...initialConfig,
  });

  const setEnabled = useCallback((enabled: boolean) => {
    setConfigState((prev) => ({ ...prev, enabled }));
  }, []);

  const setFontSize = useCallback((fontSize: number) => {
    const clampedSize = Math.max(
      VALIDATION.SUBTITLE.FONT_SIZE_MIN,
      Math.min(VALIDATION.SUBTITLE.FONT_SIZE_MAX, fontSize)
    );
    setConfigState((prev) => ({ ...prev, fontSize: clampedSize }));
  }, []);

  const setColor = useCallback((color: "white" | "yellow") => {
    setConfigState((prev) => ({ ...prev, color }));
  }, []);

  const setPosition = useCallback(
    (position: "top" | "middle" | "bottom") => {
      setConfigState((prev) => ({ ...prev, position }));
    },
    []
  );

  const setShowTranslation = useCallback((showTranslation: boolean) => {
    setConfigState((prev) => ({ ...prev, showTranslation }));
  }, []);

  const setTranslationFontSize = useCallback((translationFontSize: number) => {
    const clampedSize = Math.max(
      VALIDATION.SUBTITLE.TRANSLATION_FONT_SIZE_MIN,
      Math.min(VALIDATION.SUBTITLE.TRANSLATION_FONT_SIZE_MAX, translationFontSize)
    );
    setConfigState((prev) => ({ ...prev, translationFontSize: clampedSize }));
  }, []);

  const reset = useCallback(() => {
    setConfigState(DEFAULT_SUBTITLE_CONFIG);
  }, []);

  const setConfig = useCallback((newConfig: SubtitleConfig) => {
    setConfigState(newConfig);
  }, []);

  return {
    config,
    setEnabled,
    setFontSize,
    setColor,
    setPosition,
    setShowTranslation,
    setTranslationFontSize,
    reset,
    setConfig,
  };
}

export default useSubtitleConfig;