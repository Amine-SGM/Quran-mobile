// Video cache service for mobile
// Downloads Pexels stock videos to local cache using react-native-fs

import RNFS from 'react-native-fs';

function getVideoCacheDir(): string {
    return `${RNFS.CachesDirectoryPath}/QuranShorts/video`;
}

async function ensureVideoCacheDir(): Promise<void> {
    const dir = getVideoCacheDir();
    const exists = await RNFS.exists(dir);
    if (!exists) {
        await RNFS.mkdir(dir);
    }
}

/**
 * Download a stock video to local cache.
 * Returns the local file path.
 */
export async function downloadVideo(
    url: string,
    videoId: string,
    onProgress?: (percent: number) => void
): Promise<string> {
    await ensureVideoCacheDir();
    const cachePath = `${getVideoCacheDir()}/video_${videoId}.mp4`;

    const exists = await RNFS.exists(cachePath);
    if (exists) {
        return cachePath;
    }

    const result = await RNFS.downloadFile({
        fromUrl: url,
        toFile: cachePath,
        background: false,
        progress: (res) => {
            if (onProgress && res.contentLength > 0) {
                onProgress(Math.round((res.bytesWritten / res.contentLength) * 100));
            }
        },
    }).promise;

    if (result.statusCode !== 200) {
        throw new Error(`Failed to download video: HTTP ${result.statusCode}`);
    }

    return cachePath;
}

/**
 * Clear all cached video files.
 */
export async function clearVideoCache(): Promise<void> {
    try {
        const dir = getVideoCacheDir();
        const exists = await RNFS.exists(dir);
        if (exists) {
            await RNFS.unlink(dir);
        }
    } catch {
        // Non-fatal
    }
}
