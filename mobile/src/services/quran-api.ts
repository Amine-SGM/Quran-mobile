// Quran.com API client for mobile (direct fetch, no Electron IPC)
// Ported from desktop/src/services/quran-api.ts

export interface Surah {
    number: number;
    arabicName: string;
    englishName: string;
    revelationType: 'Meccan' | 'Medinan';
    totalAyahs: number;
}

export interface Ayah {
    surahNumber: number;
    number: number;
    arabicText: string;
    englishTranslation?: string;
    duration?: number;
}

export interface Reciter {
    id: string;
    name: string;
    language: string;
    style?: string;
    sampleAudioUrl: string;
    slug: string;
}

const BASE_URL = 'https://api.quran.com/api/v4';

async function fetchJson(url: string): Promise<any> {
    const response = await fetch(url, {
        headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
        throw new Error(`Quran.com API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

export async function getChapters(language: string = 'en'): Promise<Surah[]> {
    const data = await fetchJson(`${BASE_URL}/chapters?language=${language}`);
    return data.chapters.map((c: any): Surah => ({
        number: c.id,
        arabicName: c.name_arabic || c.name_simple || '',
        englishName: c.translated_name?.name || c.name_simple || '',
        revelationType: c.revelation_place === 'madinah' ? 'Medinan' : 'Meccan',
        totalAyahs: c.verses_count || 0,
    }));
}

export async function getVersesByChapter(
    chapter: number,
    language: string,
    range: string
): Promise<Ayah[]> {
    const [start, end] = range.split('-').map(Number);
    const perPage = Math.max(end - start + 1, 50);
    const data = await fetchJson(
        `${BASE_URL}/verses/by_chapter/${chapter}?language=${language}&fields=text_uthmani&translations=20&per_page=${perPage}`
    );
    return data.verses
        .filter((v: any) => v.verse_number >= start && v.verse_number <= end)
        .map((v: any): Ayah => ({
            surahNumber: chapter,
            number: v.verse_number,
            arabicText: v.text_uthmani || '',
            englishTranslation: (v.translations?.[0]?.text || '').replace(/<[^>]*>/g, ''),
        }));
}

export async function getReciters(language: string = 'en'): Promise<Reciter[]> {
    const data = await fetchJson(`${BASE_URL}/resources/recitations`);
    return data.recitations.map((r: any): Reciter => {
        const baseName = r.reciter_name || r.translated_name?.name || '';
        const name = r.style ? `${baseName} — ${r.style}` : baseName;
        return {
            id: r.id.toString(),
            name,
            language: 'Arabic',
            style: r.style || undefined,
            sampleAudioUrl: '',
            slug: r.id.toString(),
        };
    });
}

export async function getAudioUrlsForChapter(
    reciterId: string,
    chapterNumber: number
): Promise<Map<string, string>> {
    const data = await fetchJson(
        `${BASE_URL}/recitations/${reciterId}/by_chapter/${chapterNumber}`
    );
    const urlMap = new Map<string, string>();
    for (const audioFile of data.audio_files) {
        const verseKey = audioFile.verse_key;
        const rawUrl = audioFile.url;
        let fullUrl: string;
        if (rawUrl.startsWith('//')) {
            fullUrl = `https:${rawUrl}`;
        } else if (rawUrl.startsWith('http')) {
            fullUrl = rawUrl;
        } else {
            fullUrl = `https://verses.quran.com/${rawUrl}`;
        }
        urlMap.set(verseKey, fullUrl);
    }
    return urlMap;
}
