import { useState, useCallback } from "react";
import type { Reciter } from "../types";

interface ReciterState {
  selectedReciter: Reciter | null;
  isPlaying: boolean;
  previewAudioUrl: string | null;
}

interface UseReciterReturn {
  selectedReciter: Reciter | null;
  isPlaying: boolean;
  previewAudioUrl: string | null;
  selectReciter: (reciter: Reciter) => void;
  clearSelection: () => void;
  playPreview: (reciter: Reciter) => Promise<void>;
  stopPreview: () => void;
}

export function useReciter(): UseReciterReturn {
  const [state, setState] = useState<ReciterState>({
    selectedReciter: null,
    isPlaying: false,
    previewAudioUrl: null,
  });

  const selectReciter = useCallback((reciter: Reciter) => {
    setState((prev) => ({
      ...prev,
      selectedReciter: reciter,
      isPlaying: false,
      previewAudioUrl: null,
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState({
      selectedReciter: null,
      isPlaying: false,
      previewAudioUrl: null,
    });
  }, []);

  const playPreview = useCallback(async (reciter: Reciter) => {
    try {
      // Clear previous URL and stop if needed
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        previewAudioUrl: null,
      }));

      const response = await fetch(
        `https://api.quran.com/api/v4/chapter_recitations/${reciter.id}/1`
      );
      if (!response.ok) throw new Error("Failed to fetch preview");
      
      const data = await response.json();
      const previewUrl = data.audio_file.audio_url;

      setState((prev) => ({
        ...prev,
        isPlaying: true,
        previewAudioUrl: previewUrl,
      }));
    } catch (err) {
      console.error("Preview error:", err);
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        previewAudioUrl: null,
      }));
    }
  }, []);

  const stopPreview = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPlaying: false,
    }));
  }, []);

  return {
    selectedReciter: state.selectedReciter,
    isPlaying: state.isPlaying,
    previewAudioUrl: state.previewAudioUrl,
    selectReciter,
    clearSelection,
    playPreview,
    stopPreview,
  };
}

export default useReciter;