import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Surah } from "../types";
import "./HomeScreen.css";

interface HomeScreenProps {
  onSurahSelect: (surah: Surah) => void;
  onSettings: () => void;
  showError?: (message: string) => void;
}

interface SurahResponse {
  number: number;
  arabic_name: string;
  english_name: string;
  english_name_translation: string;
  revelation_type: string;
  total_ayahs: number;
}

export function HomeScreen({ onSurahSelect, onSettings, showError }: HomeScreenProps) {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadSurahs();
  }, []);

  async function loadSurahs() {
    try {
      setLoading(true);
      const data: SurahResponse[] = await invoke("get_surahs");
      const transformed: Surah[] = data.map((s) => ({
        number: s.number,
        arabicName: s.arabic_name,
        englishName: s.english_name,
        englishNameTranslation: s.english_name_translation,
        revelationType: s.revelation_type as "Meccan" | "Medinan",
        totalAyahs: s.total_ayahs,
      }));
      setSurahs(transformed);
      setError(null);
    } catch (err) {
      const message = err as string;
      setError(message);
      showError?.("Failed to load surahs. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) return surahs;
    const query = searchQuery.toLowerCase();
    return surahs.filter(
      (s) =>
        s.englishName.toLowerCase().includes(query) ||
        s.arabicName.includes(searchQuery) ||
        s.englishNameTranslation.toLowerCase().includes(query) ||
        s.number.toString() === query
    );
  }, [surahs, searchQuery]);

  if (loading) {
    return (
      <div className="home-screen loading">
        <div className="spinner">Loading surahs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-screen error">
        <p>Failed to load surahs: {error}</p>
        <button onClick={loadSurahs}>Retry</button>
      </div>
    );
  }

  return (
    <div className="home-screen">
      <header className="home-header">
        <div className="header-top">
          <h1>Quran Shorts</h1>
          <button className="settings-button" onClick={onSettings}>
            ⚙️
          </button>
        </div>
        <p className="subtitle">Create beautiful video shorts with Quran recitations</p>
      </header>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search by name or number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="surah-grid">
        {filteredSurahs.map((surah) => (
          <button
            key={surah.number}
            className="surah-card"
            onClick={() => onSurahSelect(surah)}
          >
            <span className="surah-number">{surah.number}</span>
            <span className="surah-arabic">{surah.arabicName}</span>
            <span className="surah-english">{surah.englishName}</span>
            <span className="surah-info">
              {surah.totalAyahs} verses • {surah.revelationType}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default HomeScreen;