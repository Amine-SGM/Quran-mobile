import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Surah } from "../types";
import "./HomeScreen.css";

const SURAH_CACHE_KEY = "quran_surahs_cache_v1";

interface SurahCachePayload {
  cachedAt: number;
  surahs: Surah[];
}

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

function isSurah(value: unknown): value is Surah {
  if (!value || typeof value !== "object") return false;
  const surah = value as Record<string, unknown>;
  return (
    typeof surah.number === "number" &&
    typeof surah.arabicName === "string" &&
    typeof surah.englishName === "string" &&
    typeof surah.englishNameTranslation === "string" &&
    typeof surah.revelationType === "string" &&
    (surah.revelationType === "Meccan" || surah.revelationType === "Medinan") &&
    typeof surah.totalAyahs === "number"
  );
}

function readSurahCache(): Surah[] | null {
  try {
    const raw = localStorage.getItem(SURAH_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SurahCachePayload>;
    if (!parsed.surahs || !Array.isArray(parsed.surahs)) return null;
    const valid = parsed.surahs.filter(isSurah);
    return valid.length > 0 ? valid : null;
  } catch {
    return null;
  }
}

function writeSurahCache(surahs: Surah[]) {
  try {
    const payload: SurahCachePayload = {
      cachedAt: Date.now(),
      surahs,
    };
    localStorage.setItem(SURAH_CACHE_KEY, JSON.stringify(payload));
  } catch {
    return;
  }
}

export function HomeScreen({ onSurahSelect, onSettings, showError }: HomeScreenProps) {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const cached = readSurahCache();
    const hasCached = Boolean(cached?.length);
    if (cached) {
      setSurahs(cached);
      setError(null);
      setLoading(false);
    }
    loadSurahs({ showLoading: !hasCached, allowCachedFallback: hasCached });
  }, []);

  async function loadSurahs(options?: { showLoading?: boolean; allowCachedFallback?: boolean }) {
    const showLoading = options?.showLoading ?? true;
    const allowCachedFallback = options?.allowCachedFallback ?? false;
    try {
      if (showLoading) {
        setLoading(true);
      }
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
      writeSurahCache(transformed);
    } catch (err) {
      const message = err as string;
      if (!allowCachedFallback) {
        setError(message);
        showError?.("Failed to load surahs. Check your connection.");
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
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
            <div className="surah-arabic surah-gradient">{surah.arabicName}</div>
            <div className="surah-english surah-gradient">{surah.englishName}</div>
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
