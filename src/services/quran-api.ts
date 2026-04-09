import type { Surah, Ayah, Reciter } from "../types";

const QURAN_API_BASE = "https://api.quran.com/v4";

export class NetworkError extends Error {
  readonly statusCode: number | null;
  readonly isRetryable: boolean;

  constructor(message: string, statusCode: number | null = null, isRetryable = true) {
    super(message);
    this.name = "NetworkError";
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
  }
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function isRetryableError(err: unknown): boolean {
  if (err instanceof NetworkError) return err.isRetryable;
  if (err instanceof TypeError) return true;
  if (err instanceof DOMException) return false;
  return true;
}

async function retryFetch(
  url: string,
  options?: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const statusCode = response.status;
        const isRetryable = statusCode >= 500 || statusCode === 429;
        throw new NetworkError(
          `Request failed with status ${statusCode}`,
          statusCode,
          isRetryable
        );
      }

      return response;
    } catch (err) {
      lastError = err;

      if (!isRetryableError(err)) {
        throw err;
      }

      if (attempt < retries) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

interface QuranApiResponse<T> {
  data: T;
}

interface SurahApiResponse {
  id: number;
  revelation_order: number;
  revelation_place: string;
  name_complex: string;
  name_arabic: string;
  name_simple: string;
  name_english: string;
  verses_count: number;
  pages: number[];
}

interface AyahApiResponse {
  id: number;
  verse_number: number;
  verse_key: string;
  surah_id: number;
  text_uthmani: string;
  text_uthmani_simple: string;
  words: Array<{
    id: number;
    position: number;
    text_uthmani: string;
    translation: { text: string };
  }>;
}

interface ReciterApiResponse {
  id: number;
  name: string;
  arabic_name: string;
  style?: string;
}

function transformSurah(data: SurahApiResponse): Surah {
  return {
    number: data.id,
    arabicName: data.name_arabic,
    englishName: data.name_english,
    englishNameTranslation: data.name_simple,
    revelationType: data.revelation_place === "Makkah" ? "Meccan" : "Medinan",
    totalAyahs: data.verses_count,
  };
}

function transformAyah(data: AyahApiResponse): Ayah {
  const englishTranslation = data.words
    .map((w) => w.translation?.text || "")
    .join(" ");

  return {
    surahNumber: data.surah_id,
    number: data.verse_number,
    arabicText: data.text_uthmani,
    englishTranslation,
  };
}

function transformReciter(data: ReciterApiResponse): Reciter {
  return {
    id: data.id,
    name: data.name,
    arabicName: data.arabic_name,
    style: data.style,
    audioUrl: `https://verses.quran.com/${data.id}`,
  };
}

export async function fetchSurahs(): Promise<Surah[]> {
  const response = await retryFetch(`${QURAN_API_BASE}/chapters?language=en`);
  const json: QuranApiResponse<SurahApiResponse[]> = await response.json();
  return json.data.map(transformSurah);
}

export async function fetchSurah(surahNumber: number): Promise<Surah | null> {
  try {
    const response = await retryFetch(
      `${QURAN_API_BASE}/chapters/${surahNumber}?language=en`
    );
    const json: QuranApiResponse<SurahApiResponse> = await response.json();
    return transformSurah(json.data);
  } catch {
    return null;
  }
}

export async function fetchAyahs(
  surahNumber: number,
  language: string = "en"
): Promise<Ayah[]> {
  const response = await retryFetch(
    `${QURAN_API_BASE}/verses/by_chapter/${surahNumber}?language=${language}&words=true&fields=text_uthmani,text_uthmani_simple&per_page=300`
  );
  const json: QuranApiResponse<AyahApiResponse[]> = await response.json();
  return json.data.map(transformAyah);
}

export async function fetchReciters(): Promise<Reciter[]> {
  const response = await retryFetch(`${QURAN_API_BASE}/audio/reciters`);
  const json: QuranApiResponse<ReciterApiResponse[]> = await response.json();
  return json.data.map(transformReciter);
}

export const quranApi = {
  fetchSurahs,
  fetchSurah,
  fetchAyahs,
  fetchReciters,
};

export default quranApi;