// Export Screen — render progress and share/save
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    Animated,
    Easing,
} from 'react-native';
import Share from 'react-native-share';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, commonStyles, spacing, radius } from '../theme';
import { Surah, Reciter, getAudioUrlsForChapter, getVersesByChapter } from '~api/quran-api';
import { getCachedAudio } from '../services/audio-cache';
import { renderVideo, buildOutputPath } from '../services/ffmpeg-service';
import { SubtitleConfig } from './SubtitleConfigScreen';

interface VideoSource {
    type: 'upload' | 'stock';
    localPath: string;
    attribution?: string;
}

interface ExportScreenProps {
    surah: Surah;
    reciter: Reciter;
    ayahStart: number;
    ayahEnd: number;
    videoSource: VideoSource;
    subtitleConfig: SubtitleConfig;
    aspectRatio: string;
    onBack: () => void;
    onHome: () => void;
}

type RenderStatus = 'idle' | 'downloading_audio' | 'rendering' | 'done' | 'error';

export const ExportScreen: React.FC<ExportScreenProps> = ({
    surah,
    reciter,
    ayahStart,
    ayahEnd,
    videoSource,
    subtitleConfig,
    aspectRatio,
    onBack,
    onHome,
}) => {
    const [status, setStatus] = useState<RenderStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [outputPath, setOutputPath] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const spinAnim = useRef(new Animated.Value(0)).current;

    const resolution = useRef('720p');

    useEffect(() => {
        AsyncStorage.getItem('mobileResolution').then(r => {
            if (r) resolution.current = r;
        });
    }, []);

    useEffect(() => {
        if (status === 'downloading_audio' || status === 'rendering') {
            Animated.loop(
                Animated.timing(spinAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            spinAnim.stopAnimation();
        }
    }, [status]);

    const ayahCount = ayahEnd - ayahStart + 1;

    const handleExport = async () => {
        try {
            setStatus('downloading_audio');
            setProgress(0);
            setErrorMessage(null);

            // 1. Fetch audio URLs for the chapter
            setStatusMessage('Fetching audio URLs…');
            const audioUrlMap = await getAudioUrlsForChapter(reciter.id, surah.number);

            // 2. Fetch ayah text (needed for subtitles)
            let ayahs: Awaited<ReturnType<typeof getVersesByChapter>> = [];
            if (subtitleConfig.enabled) {
                setStatusMessage('Fetching ayah text…');
                ayahs = await getVersesByChapter(surah.number, 'en', `${ayahStart}-${ayahEnd}`);
            }

            // 3. Download each ayah audio
            const audioFiles: string[] = [];
            for (let i = ayahStart; i <= ayahEnd; i++) {
                const key = `${surah.number}:${i}`;
                const url = audioUrlMap.get(key);
                if (!url) throw new Error(`No audio URL for ayah ${i}`);
                setStatusMessage(`Downloading audio ${i - ayahStart + 1}/${ayahCount}…`);
                setProgress(Math.round(((i - ayahStart) / ayahCount) * 40));
                const localPath = await getCachedAudio(url, reciter.id, surah.number, i);
                audioFiles.push(localPath);
            }

            // 4. Render video
            setStatus('rendering');
            setStatusMessage(subtitleConfig.enabled ? 'Rendering video with subtitles…' : 'Processing video…');
            const outPath = buildOutputPath(surah.number, ayahStart, ayahEnd, reciter.id);
            await renderVideo({
                audioFiles,
                videoFile: videoSource.localPath,
                outputPath: outPath,
                aspectRatio,
                resolution: resolution.current,
                onProgress: pct => {
                    setProgress(40 + Math.round(pct * 0.6));
                    setStatusMessage(`Rendering… ${40 + Math.round(pct * 0.6)}%`);
                },
                subtitles: subtitleConfig.enabled ? {
                    enabled: true,
                    ayahs: ayahs.map((a: any, i: number) => ({
                        arabicText: a.arabicText,
                        englishTranslation: a.englishTranslation,
                        audioFile: audioFiles[i],
                    })),
                    fontSize: subtitleConfig.fontSize,
                    color: subtitleConfig.color,
                    position: subtitleConfig.position,
                    showTranslation: subtitleConfig.showTranslation,
                    translationFontSize: subtitleConfig.translationFontSize,
                } : undefined,
            });

            setOutputPath(outPath);
            setProgress(100);
            setStatus('done');
            setStatusMessage('Done!');
        } catch (err: any) {
            setStatus('error');
            setErrorMessage(err.message || 'Unknown error');
        }
    };

    const handleShare = async () => {
        if (!outputPath) return;
        try {
            await Share.open({
                url: `file://${outputPath}`,
                type: 'video/mp4',
                title: `Surah ${surah.englishName} ${ayahStart}-${ayahEnd}`,
            });
        } catch (err: any) {
            if (err.message !== 'User did not share') {
                Alert.alert('Share Failed', err.message);
            }
        }
    };

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <ScrollView style={commonStyles.screen} contentContainerStyle={commonStyles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
                {status === 'idle' && (
                    <TouchableOpacity onPress={onBack} style={commonStyles.btnGhost}>
                        <Text style={commonStyles.btnGhostText}>← Back</Text>
                    </TouchableOpacity>
                )}
                <Text style={styles.title}>Export Video</Text>
            </View>

            {/* Summary card */}
            <View style={commonStyles.card}>
                <Text style={commonStyles.sectionTitle}>Summary</Text>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Surah</Text>
                    <Text style={styles.summaryValue}>{surah.englishName} ({surah.number})</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Ayahs</Text>
                    <Text style={styles.summaryValue}>{ayahStart}–{ayahEnd} ({ayahCount} ayahs)</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Reciter</Text>
                    <Text style={styles.summaryValue} numberOfLines={1}>{reciter.name}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Video</Text>
                    <Text style={styles.summaryValue}>{videoSource.type === 'upload' ? 'Uploaded' : 'Stock (Pexels)'}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Aspect</Text>
                    <Text style={styles.summaryValue}>{aspectRatio}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtitles</Text>
                    <Text style={styles.summaryValue}>{subtitleConfig.enabled ? 'ON' : 'OFF'}</Text>
                </View>
            </View>

            {/* Progress ring area */}
            {(status === 'downloading_audio' || status === 'rendering') && (
                <View style={[commonStyles.center, { marginVertical: spacing.xl }]}>
                    <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
                    <Text style={styles.progressPercent}>{progress}%</Text>
                    <Text style={styles.statusMessage}>{statusMessage}</Text>
                </View>
            )}

            {status === 'done' && (
                <View style={[commonStyles.center, { marginVertical: spacing.xl }]}>
                    <Text style={{ fontSize: 56 }}>✅</Text>
                    <Text style={styles.doneText}>Video Ready!</Text>
                    <TouchableOpacity
                        style={[commonStyles.btnPrimary, { marginTop: spacing.lg, paddingHorizontal: spacing.xl }]}
                        onPress={handleShare}
                    >
                        <Text style={commonStyles.btnPrimaryText}>📤 Share Video</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[commonStyles.btnSecondary, { marginTop: spacing.md, paddingHorizontal: spacing.xl }]}
                        onPress={onHome}
                    >
                        <Text style={commonStyles.btnSecondaryText}>Make Another</Text>
                    </TouchableOpacity>
                </View>
            )}

            {status === 'error' && (
                <View style={[commonStyles.errorBox, { marginTop: spacing.md }]}>
                    <Text style={{ color: colors.ruby, fontWeight: '600', marginBottom: 4 }}>Export Failed</Text>
                    <Text style={{ color: colors.ruby, fontSize: 13 }}>{errorMessage}</Text>
                    <TouchableOpacity
                        style={[commonStyles.btnSecondary, { marginTop: spacing.md }]}
                        onPress={() => setStatus('idle')}
                    >
                        <Text style={commonStyles.btnSecondaryText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            )}

            {status === 'idle' && (
                <TouchableOpacity
                    style={[commonStyles.btnPrimary, { marginTop: spacing.lg }]}
                    onPress={handleExport}
                >
                    <Text style={commonStyles.btnPrimaryText}>🚀 Export Video</Text>
                </TouchableOpacity>
            )}

            {videoSource.attribution && (
                <Text style={styles.attribution}>{videoSource.attribution}</Text>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.textPrimary,
        marginLeft: spacing.sm,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
    },
    summaryLabel: {
        fontSize: 13,
        color: colors.textMuted,
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 13,
        color: colors.textPrimary,
        fontWeight: '600',
        maxWidth: '60%',
        textAlign: 'right',
    },
    spinner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: colors.emeraldGlow,
        borderTopColor: colors.emerald,
    },
    progressPercent: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.emerald,
        marginTop: spacing.md,
    },
    statusMessage: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: spacing.sm,
        textAlign: 'center',
    },
    doneText: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: spacing.md,
    },
    attribution: {
        fontSize: 11,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: spacing.lg,
        fontStyle: 'italic',
    },
});
