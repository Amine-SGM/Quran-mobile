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
  playPreview: (reciter: Reciter) => void;
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

  const playPreview = useCallback((reciter: Reciter) => {
    const previewUrl = `https://cdn.islamic.network/quran/audio-preview/${reciter.id}/1.mp3`;
    setState((prev) => ({
      ...prev,
      isPlaying: true,
      previewAudioUrl: previewUrl,
    }));
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