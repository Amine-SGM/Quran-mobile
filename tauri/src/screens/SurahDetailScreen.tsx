import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Surah, Ayah } from "../types";
import { AyahCard } from "../components/AyahCard";
import { RangeSelector } from "../components/RangeSelector";
import { MAX_AYAHS_PER_VIDEO } from "../types";
import "./SurahDetailScreen.css";

interface SurahDetailScreenProps {
  surah: Surah;
  onBack: () => void;
  onContinue: (surahNumber: number, ayahStart: number, ayahEnd: number) => void;
}

interface AyahResponse {
  surah_number: number;
  number: number;
  arabic_text: string;
  english_translation?: string;
}

export function SurahDetailScreen({
  surah,
  onBack,
  onContinue,
}: SurahDetailScreenProps) {
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(Math.min(surah.totalAyahs, MAX_AYAHS_PER_VIDEO));
  const [rangeError, setRangeError] = useState<string | null>(null);

  useEffect(() => {
    loadAyahs();
  }, [surah.number]);

  async function loadAyahs() {
    try {
      setLoading(true);
      const data: AyahResponse[] = await invoke("get_ayahs", {
        surahNumber: surah.number,
        language: "en",
      });
      const transformed: Ayah[] = data.map((a) => ({
        surahNumber: a.surah_number,
        number: a.number,
        arabicText: a.arabic_text,
        englishTranslation: a.english_translation,
      }));
      setAyahs(transformed);
      setError(null);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  }

  const validateAndSetRange = (start: number, end: number) => {
    setRangeStart(start);
    setRangeEnd(end);

    if (start < 1) {
      setRangeError("Start must be at least 1");
    } else if (end > surah.totalAyahs) {
      setRangeError(`End cannot exceed ${surah.totalAyahs}`);
    } else if (start > end) {
      setRangeError("Start cannot be greater than end");
    } else if (end - start + 1 > MAX_AYAHS_PER_VIDEO) {
      setRangeError(`Maximum ${MAX_AYAHS_PER_VIDEO} ayahs allowed`);
    } else {
      setRangeError(null);
    }
  };

  const handleContinue = () => {
    if (rangeError) return;
    onContinue(surah.number, rangeStart, rangeEnd);
  };

  const selectedAyahs = ayahs.filter(
    (a) => a.number >= rangeStart && a.number <= rangeEnd
  );

  if (loading) {
    return (
      <div className="surah-detail loading">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <div className="spinner">Loading ayahs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="surah-detail error">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <p>Failed to load ayahs: {error}</p>
        <button onClick={loadAyahs}>Retry</button>
      </div>
    );
  }

  return (
    <div className="surah-detail">
      <header className="detail-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <div className="surah-title">
          <span className="surah-number">{surah.number}</span>
          <h2>{surah.englishName}</h2>
          <span className="surah-arabic">{surah.arabicName}</span>
        </div>
        <p className="surah-meta">
          {surah.totalAyahs} verses • {surah.revelationType}
        </p>
      </header>

      <div className="range-section">
        <h3>Select Ayah Range</h3>
        <p className="range-hint">
          Select up to {MAX_AYAHS_PER_VIDEO} ayahs for your video
        </p>
        <RangeSelector
          surahNumber={surah.number}
          totalAyahs={surah.totalAyahs}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onChange={validateAndSetRange}
        />
        {rangeError && <p className="range-error">{rangeError}</p>}
        <p className="selection-summary">
          Selected: Ayah {rangeStart} - {rangeEnd} ({rangeEnd - rangeStart + 1} ayahs)
        </p>
      </div>

      <div className="preview-section">
        <h4>Preview</h4>
        <div className="ayah-list">
          {selectedAyahs.map((ayah) => (
            <AyahCard key={ayah.number} ayah={ayah} />
          ))}
        </div>
      </div>

      <div className="action-bar">
        <button
          className="continue-button"
          onClick={handleContinue}
          disabled={!!rangeError}
        >
          Continue to Reciter Selection →
        </button>
      </div>
    </div>
  );
}

export default SurahDetailScreen;