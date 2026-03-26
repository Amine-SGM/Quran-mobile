import { useState, useCallback } from "react";
import type { AspectRatio, Resolution, OutputSettings } from "../types";
import { DEFAULT_OUTPUT_SETTINGS } from "../types";

interface UseOutputSettingsReturn {
  settings: OutputSettings;
  setAspectRatio: (ratio: AspectRatio) => void;
  setResolution: (res: Resolution) => void;
  reset: () => void;
}

export function useOutputSettings(
  initialSettings?: Partial<OutputSettings>
): UseOutputSettingsReturn {
  const [settings, setSettings] = useState<OutputSettings>({
    ...DEFAULT_OUTPUT_SETTINGS,
    ...initialSettings,
  });

  const setAspectRatio = useCallback((aspectRatio: AspectRatio) => {
    setSettings((prev) => ({ ...prev, aspectRatio }));
  }, []);

  const setResolution = useCallback((resolution: Resolution) => {
    setSettings((prev) => ({ ...prev, resolution }));
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULT_OUTPUT_SETTINGS);
  }, []);

  return {
    settings,
    setAspectRatio,
    setResolution,
    reset,
  };
}

export default useOutputSettings;