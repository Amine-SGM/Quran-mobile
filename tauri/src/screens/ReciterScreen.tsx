import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Reciter } from "../types";
import { ReciterCard } from "../components/ReciterCard";
import { AudioPlayer } from "../components/AudioPlayer";
import { useReciter } from "../hooks/useReciter";
import "./ReciterScreen.css";

interface ReciterScreenProps {
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
  onBack: () => void;
  onContinue: (reciterId: number) => void;
  onRecitersLoaded?: (reciters: Reciter[]) => void;
}

interface ReciterResponse {
  id: number;
  name: string;
  arabic_name: string;
  style?: string;
}

export function ReciterScreen({
  surahNumber,
  ayahStart,
  ayahEnd,
  onBack,
  onContinue,
  onRecitersLoaded,
}: ReciterScreenProps) {
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingReciterId, setPlayingReciterId] = useState<number | null>(null);

  const {
    selectedReciter,
    isPlaying,
    previewAudioUrl,
    selectReciter,
    playPreview,
    stopPreview,
  } = useReciter();

  useEffect(() => {
    loadReciters();
  }, []);

  async function loadReciters() {
    try {
      setLoading(true);
      const data: ReciterResponse[] = await invoke("get_reciters");
      const transformed: Reciter[] = data.map((r) => ({
        id: r.id,
        name: r.name,
        arabicName: r.arabic_name,
        style: r.style,
      }));
      setReciters(transformed);
      onRecitersLoaded?.(transformed);
      setError(null);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  }

  const handlePlayPreview = useCallback(
    (reciter: Reciter) => {
      if (playingReciterId === reciter.id) {
        stopPreview();
        setPlayingReciterId(null);
      } else {
        stopPreview();
        playPreview(reciter);
        setPlayingReciterId(reciter.id);
      }
    },
    [playingReciterId, stopPreview, playPreview]
  );

  const handleSelectReciter = useCallback(
    (reciter: Reciter) => {
      if (playingReciterId === reciter.id) {
        stopPreview();
        setPlayingReciterId(null);
      }
      selectReciter(reciter);
    },
    [playingReciterId, stopPreview, selectReciter]
  );

  const handleContinue = () => {
    if (selectedReciter) {
      onContinue(selectedReciter.id);
    }
  };

  const handlePreviewEnded = useCallback(() => {
    setPlayingReciterId(null);
    stopPreview();
  }, [stopPreview]);

  if (loading) {
    return (
      <div className="reciter-screen loading">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <div className="spinner">Loading reciters...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reciter-screen error">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <p>Failed to load reciters: {error}</p>
        <button onClick={loadReciters}>Retry</button>
      </div>
    );
  }

  return (
    <div className="reciter-screen">
      <header className="reciter-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>Select Reciter</h1>
        <p className="selection-info">
          Surah {surahNumber}, Ayahs {ayahStart}-{ayahEnd}
        </p>
      </header>

      <div className="reciter-list">
        {reciters.map((reciter) => (
          <ReciterCard
            key={reciter.id}
            reciter={reciter}
            isSelected={selectedReciter?.id === reciter.id}
            isPlaying={playingReciterId === reciter.id}
            onSelect={() => handleSelectReciter(reciter)}
            onPlayPreview={() => handlePlayPreview(reciter)}
          />
        ))}
      </div>

      {playingReciterId && previewAudioUrl && (
        <div className="preview-player">
          <AudioPlayer
            audioUrl={previewAudioUrl}
            isPlaying={isPlaying}
            onEnded={handlePreviewEnded}
            autoPlay
          />
        </div>
      )}

      <div className="action-bar">
        <button
          className="continue-button"
          onClick={handleContinue}
          disabled={!selectedReciter}
        >
          Continue to Output Settings →
        </button>
      </div>
    </div>
  );
}

export default ReciterScreen;