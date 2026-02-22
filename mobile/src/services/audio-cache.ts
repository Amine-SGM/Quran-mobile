// Audio cache service for mobile
// Uses react-native-fs for file system access

import RNFS from 'react-native-fs';

const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

function getCacheDir(): string {
    return `${RNFS.CachesDirectoryPath}/QuranShorts/audio`;
}

function getCachePath(reciterId: string, surahNumber: number, ayahNumber: number): string {
    return `${getCacheDir()}/${reciterId}_${surahNumber}_${ayahNumber}.mp3`;
}

async function ensureCacheDir(): Promise<void> {
    const dir = getCacheDir();
    const exists = await RNFS.exists(dir);
    if (!exists) {
        await RNFS.mkdir(dir);
    }
}

/**
 * Download and cache a single ayah audio file.
 * Returns the local file path.
 */
export async function getCachedAudio(
    url: string,
    reciterId: string,
    surahNumber: number,
    ayahNumber: number
): Promise<string> {
    await ensureCacheDir();
    const cachePath = getCachePath(reciterId, surahNumber, ayahNumber);

    // Check if cached file exists and is fresh
    const exists = await RNFS.exists(cachePath);
    if (exists) {
        const stat = await RNFS.stat(cachePath);
        const age = Date.now() - new Date(stat.mtime ?? 0).getTime();
        if (age < CACHE_TTL_MS) {
            return cachePath;
        }
        // Stale — delete and re-download
        await RNFS.unlink(cachePath);
    }

    // Download
    const result = await RNFS.downloadFile({
        fromUrl: url,
        toFile: cachePath,
        background: false,
    }).promise;

    if (result.statusCode !== 200) {
        throw new Error(`Failed to download audio: HTTP ${result.statusCode}`);
    }

    return cachePath;
}

/**
 * Delete all cached audio files older than TTL.
 * Call on app start.
 */
export async function cleanupOldCache(): Promise<void> {
    try {
        const dir = getCacheDir();
        const exists = await RNFS.exists(dir);
        if (!exists) return;

        const files = await RNFS.readDir(dir);
        const now = Date.now();
        for (const file of files) {
            const age = now - new Date(file.mtime ?? 0).getTime();
            if (age > CACHE_TTL_MS) {
                await RNFS.unlink(file.path);
            }
        }
    } catch {
        // Non-fatal
    }
}

/**
 * Clear all cached audio files.
 */
export async function clearAudioCache(): Promise<void> {
    try {
        const dir = getCacheDir();
        const exists = await RNFS.exists(dir);
        if (exists) {
            await RNFS.unlink(dir);
        }
    } catch {
        // Non-fatal
    }
}
