import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    Pressable,
    ScrollView,
    StyleSheet,
    Alert,
    Animated,
    Easing,
    StatusBar,
} from 'react-native';
import Share from 'react-native-share';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, typography, accessibility } from '~theme/tokens';
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

    const resolution = useRef('1080p'); // Standardized luxury default

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
                    duration: 1500,
                    easing: Easing.bezier(0.4, 0, 0.2, 1),
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

            setStatusMessage('Connecting to spiritual archives...');
            const audioUrlMap = await getAudioUrlsForChapter(reciter.id, surah.number);

            let ayahs: any[] = [];
            if (subtitleConfig.enabled) {
                setStatusMessage('Retrieving sacred verses...');
                ayahs = await getVersesByChapter(surah.number, 'en', `${ayahStart}-${ayahEnd}`);
            }

            const audioFiles: string[] = [];
            for (let i = ayahStart; i <= ayahEnd; i++) {
                const key = `${surah.number}:${i}`;
                const url = audioUrlMap.get(key);
                if (!url) throw new Error(`Missing audio reference for Ayah ${i}`);
                
                setStatusMessage(`Downloading Ayah ${i - ayahStart + 1} of ${ayahCount}...`);
                setProgress(Math.round(((i - ayahStart) / ayahCount) * 30));
                const localPath = await getCachedAudio(url, reciter.id, surah.number, i);
                audioFiles.push(localPath);
            }

            setStatus('rendering');
            setStatusMessage('Crafting your masterpiece...');
            const outPath = buildOutputPath(surah.number, ayahStart, ayahEnd, reciter.id);
            
            await renderVideo({
                audioFiles,
                videoFile: videoSource.localPath,
                outputPath: outPath,
                aspectRatio,
                resolution: resolution.current,
                onProgress: pct => {
                    const currentProgress = 30 + Math.round(pct * 0.7);
                    setProgress(currentProgress);
                },
                subtitles: subtitleConfig.enabled ? {
                    enabled: true,
                    ayahs: ayahs.map((a, i) => ({
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
            setStatusMessage('Creation Complete');
        } catch (err: any) {
            setStatus('error');
            setErrorMessage(err.message || 'The cosmic alignment failed during render.');
        }
    };

    const handleShare = async () => {
        if (!outputPath) return;
        try {
            await Share.open({
                url: `file://${outputPath}`,
                type: 'video/mp4',
                title: `Noble Qur'an: ${surah.englishName}`,
            });
        } catch (err: any) {
            if (err.message !== 'User did not share') {
                Alert.alert('Share Unavailable', err.message);
            }
        }
    };

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <View style={styles.header}>
                {status === 'idle' && (
                    <Pressable onPress={onBack} style={styles.backBtn}>
                        <Text style={styles.backIcon}>←</Text>
                    </Pressable>
                )}
                <Text style={styles.title}>Export Creation</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Summary Section */}
                <View style={styles.glassCard}>
                    <Text style={styles.sectionTitle}>Video Specification</Text>
                    <View style={styles.specGrid}>
                        <View style={styles.specItem}>
                            <Text style={styles.specLabel}>Surah</Text>
                            <Text style={styles.specValue} numberOfLines={1}>{surah.englishName}</Text>
                        </View>
                        <View style={styles.specItem}>
                            <Text style={styles.specLabel}>Ayahs</Text>
                            <Text style={styles.specValue}>{ayahStart}–{ayahEnd}</Text>
                        </View>
                        <View style={styles.specItem}>
                            <Text style={styles.specLabel}>Aspect</Text>
                            <Text style={styles.specValue}>{aspectRatio}</Text>
                        </View>
                        <View style={styles.specItem}>
                            <Text style={styles.specLabel}>Voice</Text>
                            <Text style={styles.specValue} numberOfLines={1}>{reciter.name.split('—')[0]}</Text>
                        </View>
                    </View>
                </View>

                {/* Main Action / Progress Area */}
                <View style={styles.mainActionArea}>
                    {(status === 'downloading_audio' || status === 'rendering') && (
                        <View style={styles.progressContainer}>
                            <View style={styles.spinnerWrapper}>
                                <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
                                <View style={styles.progressInner}>
                                    <Text style={styles.progressText}>{progress}%</Text>
                                </View>
                            </View>
                            <Text style={styles.statusMsg}>{statusMessage}</Text>
                        </View>
                    )}

                    {status === 'idle' && (
                        <Pressable style={styles.btnPrimary} onPress={handleExport}>
                            <Text style={styles.btnPrimaryText}>✨ Begin Generation</Text>
                        </Pressable>
                    )}

                    {status === 'done' && (
                        <View style={styles.doneContainer}>
                            <View style={styles.successIconWrapper}>
                                <Text style={styles.successIcon}>✓</Text>
                            </View>
                            <Text style={styles.doneTitle}>Masterpiece Ready</Text>
                            <View style={styles.doneActions}>
                                <Pressable style={styles.btnPrimary} onPress={handleShare}>
                                    <Text style={styles.btnPrimaryText}>📤 Share Video</Text>
                                </Pressable>
                                <Pressable style={styles.btnSecondary} onPress={onHome}>
                                    <Text style={styles.btnSecondaryText}>New Creation</Text>
                                </Pressable>
                            </View>
                        </View>
                    )}

                    {status === 'error' && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorIcon}>⚠️</Text>
                            <Text style={styles.errorTitle}>Generation Failed</Text>
                            <Text style={styles.errorMsg}>{errorMessage}</Text>
                            <Pressable style={styles.btnSecondary} onPress={() => setStatus('idle')}>
                                <Text style={styles.btnSecondaryText}>Try Again</Text>
                            </Pressable>
                        </View>
                    )}
                </View>

                {videoSource.attribution && (
                    <Text style={styles.attribution}>{videoSource.attribution}</Text>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgBase,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.md,
        gap: spacing.md,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
        backgroundColor: colors.bgSurface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    backIcon: {
        color: colors.textPrimary,
        fontSize: 20,
    },
    title: {
        ...typography.h2,
        color: colors.textPrimary,
    },
    scrollContent: {
        padding: spacing.lg,
        gap: spacing.xl,
        paddingBottom: spacing['3xl'],
    },
    glassCard: {
        backgroundColor: colors.glassBase,
        borderRadius: radius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        gap: spacing.md,
    },
    sectionTitle: {
        ...typography.small,
        color: colors.accentGold,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    specGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    specItem: {
        flex: 1,
        minWidth: '40%',
        gap: 2,
    },
    specLabel: {
        ...typography.small,
        color: colors.textMuted,
    },
    specValue: {
        ...typography.body,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    mainActionArea: {
        flex: 1,
        minHeight: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnPrimary: {
        backgroundColor: colors.accentEmerald,
        paddingVertical: 18,
        paddingHorizontal: spacing.xl,
        borderRadius: radius.md,
        width: '100%',
        alignItems: 'center',
        ...accessibility.minTouchTarget,
    },
    btnPrimaryText: {
        ...typography.bodyLg,
        color: colors.white,
        fontWeight: '700',
    },
    btnSecondary: {
        backgroundColor: colors.bgSurfaceElevated,
        paddingVertical: 14,
        paddingHorizontal: spacing.xl,
        borderRadius: radius.md,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        ...accessibility.minTouchTarget,
    },
    btnSecondaryText: {
        ...typography.body,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    progressContainer: {
        alignItems: 'center',
        gap: spacing.lg,
    },
    spinnerWrapper: {
        width: 140,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinner: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 3,
        borderColor: 'transparent',
        borderTopColor: colors.accentGold,
        borderRightColor: colors.accentGold,
    },
    progressInner: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.bgSurface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    progressText: {
        ...typography.h1,
        color: colors.textPrimary,
    },
    statusMsg: {
        ...typography.body,
        color: colors.textSecondary,
        fontStyle: 'italic',
    },
    doneContainer: {
        alignItems: 'center',
        gap: spacing.lg,
        width: '100%',
    },
    successIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.accentEmeraldGlow,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.accentEmerald,
    },
    successIcon: {
        fontSize: 40,
        color: colors.accentEmerald,
        fontWeight: 'bold',
    },
    doneTitle: {
        ...typography.h2,
        color: colors.textPrimary,
    },
    doneActions: {
        width: '100%',
        gap: spacing.md,
    },
    errorContainer: {
        alignItems: 'center',
        gap: spacing.md,
        width: '100%',
    },
    errorIcon: {
        fontSize: 48,
    },
    errorTitle: {
        ...typography.h3,
        color: colors.error,
    },
    errorMsg: {
        ...typography.body,
        color: colors.textMuted,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    attribution: {
        ...typography.small,
        color: colors.textMuted,
        textAlign: 'center',
        fontStyle: 'italic',
    }
});
