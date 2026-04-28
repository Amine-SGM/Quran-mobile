import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Reciter } from "../types";

interface ReciterState {
  selectedReciter: Reciter | null;
  isPlaying: boolean;
  previewAudioUrl: string | null;
}

interface PreviewParams {
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
}

interface UseReciterReturn {
  selectedReciter: Reciter | null;
  isPlaying: boolean;
  previewAudioUrl: string | null;
  selectReciter: (reciter: Reciter) => void;
  clearSelection: () => void;
  playPreview: (reciter: Reciter, params: PreviewParams) => Promise<void>;
  stageSelectedReciterAudio: (reciter: Reciter, params: PreviewParams) => Promise<void>;
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

  const playPreview = useCallback(async (reciter: Reciter, params: PreviewParams) => {
    try {
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        previewAudioUrl: null,
      }));

      const previewAyah = params.ayahStart;
      const response = await fetch(
        `https://api.quran.com/api/v4/recitations/${reciter.id}/by_ayah/${params.surahNumber}:${previewAyah}`
      );
      if (!response.ok) throw new Error("Failed to fetch preview");

      const data = await response.json();
      const previewUrl = data.audio_files?.[0]?.url;
      if (!previewUrl) throw new Error("Preview audio unavailable");

      setState((prev) => ({
        ...prev,
        isPlaying: true,
        previewAudioUrl: previewUrl.startsWith("http") ? previewUrl : `https://verses.quran.com/${previewUrl}`,
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

  const stageSelectedReciterAudio = useCallback(async (reciter: Reciter, params: PreviewParams) => {
    await invoke("stage_reciter_audio", {
      reciterId: reciter.id,
      surahNumber: params.surahNumber,
      ayahStart: params.ayahStart,
      ayahEnd: params.ayahEnd,
      reciter_id: reciter.id,
      surah_number: params.surahNumber,
      ayah_start: params.ayahStart,
      ayah_end: params.ayahEnd,
    });
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
    stageSelectedReciterAudio,
    stopPreview,
  };
}

export default useReciter;