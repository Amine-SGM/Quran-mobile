// FFmpeg service for mobile
// Uses ffmpeg-kit-react-native for video rendering with real progress tracking

import { FFmpegKit, FFprobeKit, ReturnCode, Statistics } from 'ffmpeg-kit-react-native';
import RNFS from 'react-native-fs';

export interface SubtitleRenderData {
    enabled: boolean;
    ayahs: Array<{
        arabicText: string;
        englishTranslation?: string;
        audioFile: string;          // local path — used to get per-ayah duration
    }>;
    fontSize: number;
    color: 'white' | 'yellow' | 'black_outline';
    position: 'top' | 'middle' | 'bottom';
    showTranslation: boolean;
    translationFontSize: number;
}

export interface RenderOptions {
    audioFiles: string[];           // local paths to audio files
    videoFile: string;              // local path to video file
    outputPath: string;             // where to save the output
    aspectRatio?: string;           // e.g. '9:16'
    resolution?: string;            // '720p' | '1080p'
    onProgress?: (percent: number) => void;
    subtitles?: SubtitleRenderData;
}

/** Map resolution string to target dimensions */
function getResolutionDimensions(resolution: string, aspectRatio: string): { w: number; h: number } {
    const baseWidth = resolution === '1080p' ? 1080 : 720;
    if (aspectRatio === '9:16') return { w: baseWidth, h: Math.round(baseWidth * 16 / 9) };
    if (aspectRatio === '1:1') return { w: baseWidth, h: baseWidth };
    if (aspectRatio === '4:5') return { w: baseWidth, h: Math.round(baseWidth * 5 / 4) };
    if (aspectRatio === '16:9') return { w: Math.round(baseWidth * 16 / 9), h: baseWidth };
    return { w: baseWidth, h: Math.round(baseWidth * 16 / 9) };
}

/**
 * Build a concat file list for FFmpeg.
 * Returns the path to the temp file list.
 */
async function buildAudioConcatFile(audioFiles: string[]): Promise<string> {
    const listPath = `${RNFS.CachesDirectoryPath}/QuranShorts/audio_list.txt`;
    const content = audioFiles.map(f => `file '${f}'`).join('\n');
    await RNFS.writeFile(listPath, content, 'utf8');
    return listPath;
}

/**
 * Get the duration of an audio file in seconds using FFprobe.
 */
async function getAudioFileDuration(filePath: string): Promise<number> {
    const session = await FFprobeKit.getMediaInformation(filePath);
    const info = session.getMediaInformation();
    if (info) {
        const duration = info.getDuration();
        if (typeof duration === 'number' && duration > 0) return duration;
        // getDuration() may return a string in some builds
        const parsed = parseFloat(String(duration));
        if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    // Fallback: assume ~5 seconds per ayah if probe fails
    return 5;
}

/**
 * Format seconds to SRT timestamp: HH:MM:SS,mmm
 */
function formatSrtTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const millis = Math.round((totalSeconds % 1) * 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

/**
 * Escape text for SRT (strip newlines, keep basic content).
 */
function escapeSrtText(text: string): string {
    return text.replace(/\r?\n/g, ' ').trim();
}

/**
 * Build an SRT subtitle file from ayah data with per-ayah timing.
 * Returns the path to the generated SRT file.
 */
async function buildSrtFile(
    subtitles: SubtitleRenderData,
): Promise<{ srtPath: string; totalDurationSec: number }> {
    const srtPath = `${RNFS.CachesDirectoryPath}/QuranShorts/subtitles.srt`;
    const lines: string[] = [];
    let currentTime = 0;

    for (let i = 0; i < subtitles.ayahs.length; i++) {
        const ayah = subtitles.ayahs[i];
        const duration = await getAudioFileDuration(ayah.audioFile);

        const startTime = formatSrtTime(currentTime);
        const endTime = formatSrtTime(currentTime + duration);

        const subtitleIndex = i + 1;
        lines.push(String(subtitleIndex));
        lines.push(`${startTime} --> ${endTime}`);

        // Arabic text (primary)
        lines.push(escapeSrtText(ayah.arabicText));

        // English translation (secondary, if enabled)
        if (subtitles.showTranslation && ayah.englishTranslation) {
            lines.push(escapeSrtText(ayah.englishTranslation));
        }

        lines.push(''); // blank line between entries
        currentTime += duration;
    }

    await RNFS.writeFile(srtPath, lines.join('\n'), 'utf8');
    return { srtPath, totalDurationSec: currentTime };
}

/**
 * Map subtitle color config to an ASS primary color hex (AABBGGRR format).
 */
function getSubtitlePrimaryColor(color: SubtitleRenderData['color']): string {
    switch (color) {
        case 'yellow': return '&H0037AFD4'; // gold #D4AF37 → ASS BGR
        case 'black_outline': return '&H00FFFFFF'; // white text with black outline
        case 'white':
        default: return '&H00FFFFFF';
    }
}

/**
 * Map subtitle color config to an ASS outline color.
 */
function getSubtitleOutlineColor(color: SubtitleRenderData['color']): string {
    switch (color) {
        case 'black_outline': return '&H00000000'; // black outline
        case 'yellow': return '&H00000000';
        case 'white':
        default: return '&H80000000'; // semi-transparent black
    }
}

/**
 * Get the subtitle vertical alignment value for ASS.
 * ASS alignment: 1-3 bottom, 4-6 middle, 7-9 top. Center-aligned = 2/5/8.
 */
function getSubtitleAlignment(position: SubtitleRenderData['position']): number {
    switch (position) {
        case 'top': return 8;     // top-center
        case 'middle': return 5;  // middle-center
        case 'bottom':
        default: return 2;        // bottom-center
    }
}

/**
 * Get the vertical margin for subtitle positioning.
 */
function getSubtitleMarginV(position: SubtitleRenderData['position'], h: number): number {
    switch (position) {
        case 'top': return Math.round(h * 0.05);
        case 'middle': return 0;
        case 'bottom':
        default: return Math.round(h * 0.08);
    }
}

/**
 * Build the FFmpeg subtitles filter string with ASS-style overrides.
 * Uses the 'subtitles' filter which supports force_style for styling.
 */
function buildSubtitlesFilter(
    srtPath: string,
    subtitles: SubtitleRenderData,
    h: number,
): string {
    const primaryColor = getSubtitlePrimaryColor(subtitles.color);
    const outlineColor = getSubtitleOutlineColor(subtitles.color);
    const alignment = getSubtitleAlignment(subtitles.position);
    const marginV = getSubtitleMarginV(subtitles.position, h);
    const outlineWidth = subtitles.color === 'black_outline' ? 3 : 2;
    const fontSize = subtitles.fontSize;

    // Escape path for FFmpeg filter (backslashes and colons need escaping)
    const escapedPath = srtPath
        .replace(/\\/g, '/')
        .replace(/:/g, '\\:');

    const forceStyle = [
        `FontSize=${fontSize}`,
        `PrimaryColour=${primaryColor}`,
        `OutlineColour=${outlineColor}`,
        `BackColour=&H80000000`,
        `Outline=${outlineWidth}`,
        `Shadow=1`,
        `Alignment=${alignment}`,
        `MarginV=${marginV}`,
        `WrapStyle=1`,
    ].join(',');

    return `subtitles='${escapedPath}':force_style='${forceStyle}'`;
}

/**
 * Get total duration of all audio files by probing each one.
 * Returns total duration in milliseconds.
 */
async function getTotalAudioDurationMs(audioFiles: string[]): Promise<number> {
    let totalMs = 0;
    for (const file of audioFiles) {
        const durationSec = await getAudioFileDuration(file);
        totalMs += durationSec * 1000;
    }
    return totalMs;
}

/**
 * Render a Quran short video with optional subtitle overlay.
 * Concatenates audio files and merges with video.
 * Uses real FFmpeg progress tracking via statistics callback.
 */
export async function renderVideo(options: RenderOptions): Promise<string> {
    const {
        audioFiles,
        videoFile,
        outputPath,
        aspectRatio = '9:16',
        resolution = '720p',
        onProgress,
        subtitles,
    } = options;

    // Ensure output directory exists
    const outputDir = outputPath.substring(0, outputPath.lastIndexOf('/'));
    const dirExists = await RNFS.exists(outputDir);
    if (!dirExists) {
        await RNFS.mkdir(outputDir);
    }

    // Build audio concat file
    const audioListPath = await buildAudioConcatFile(audioFiles);

    // Get target dimensions
    const { w, h } = getResolutionDimensions(resolution, aspectRatio);

    // Get total audio duration for progress tracking
    const totalDurationMs = await getTotalAudioDurationMs(audioFiles);

    // Build video filter chain
    const scaleFilter = `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2`;

    let videoFilter: string;
    if (subtitles?.enabled && subtitles.ayahs.length > 0) {
        // Build SRT file and append subtitles filter
        const { srtPath } = await buildSrtFile(subtitles);
        const subsFilter = buildSubtitlesFilter(srtPath, subtitles, h);
        videoFilter = `${scaleFilter},${subsFilter}`;
    } else {
        videoFilter = scaleFilter;
    }

    // Build FFmpeg command
    const cmd = [
        '-i', videoFile,
        '-f', 'concat', '-safe', '0', '-i', audioListPath,
        '-vf', `"${videoFilter}"`,
        '-c:v', 'libx264', '-crf', '28', '-preset', 'veryfast',
        '-c:a', 'aac', '-b:a', '128k',
        '-map', '0:v:0', '-map', '1:a:0',
        '-shortest',
        '-y', outputPath,
    ].join(' ');

    // Use executeAsync with statistics callback for real progress tracking
    return new Promise<string>((resolve, reject) => {
        FFmpegKit.executeAsync(
            cmd,
            // Complete callback
            async (session) => {
                const returnCode = await session.getReturnCode();
                if (ReturnCode.isSuccess(returnCode)) {
                    if (onProgress) onProgress(100);
                    resolve(outputPath);
                } else {
                    const logs = await session.getAllLogsAsString();
                    reject(new Error(`FFmpeg failed: ${logs?.slice(-500) || 'unknown error'}`));
                }
            },
            // Log callback (no-op, we don't need per-line logs)
            undefined,
            // Statistics callback — real progress tracking
            (statistics: Statistics) => {
                if (onProgress && totalDurationMs > 0) {
                    const currentTimeMs = statistics.getTime();
                    const percent = Math.min(Math.round((currentTimeMs / totalDurationMs) * 100), 99);
                    onProgress(percent);
                }
            },
        );
    });
}

/**
 * Get the output directory for rendered videos.
 */
export function getOutputDir(): string {
    return `${RNFS.DocumentDirectoryPath}/QuranShorts`;
}

/**
 * Build output file path for a render job.
 */
export function buildOutputPath(surahNumber: number, ayahStart: number, ayahEnd: number, reciterId: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `${getOutputDir()}/${timestamp}-S${surahNumber}-${ayahStart}-${ayahEnd}-${reciterId}.mp4`;
}
