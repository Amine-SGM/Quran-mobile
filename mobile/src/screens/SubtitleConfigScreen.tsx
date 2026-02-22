// Subtitle Configuration Screen
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Switch,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
} from 'react-native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, commonStyles, spacing, radius } from '../theme';

export interface SubtitleConfig {
    enabled: boolean;
    fontSize: number;
    color: 'white' | 'yellow' | 'black_outline';
    position: 'top' | 'middle' | 'bottom';
    showTranslation: boolean;
    translationFontSize: number;
}

const STORAGE_KEY = 'subtitleConfig';
const RATIO_KEY = 'aspectRatio';

const DEFAULT_CONFIG: SubtitleConfig = {
    enabled: true,
    fontSize: 36,
    color: 'white',
    position: 'bottom',
    showTranslation: true,
    translationFontSize: 18,
};

interface SubtitleConfigScreenProps {
    onNext: (config: SubtitleConfig, aspectRatio: string) => void;
    onBack: () => void;
}

export const SubtitleConfigScreen: React.FC<SubtitleConfigScreenProps> = ({ onNext, onBack }) => {
    const [config, setConfig] = useState<SubtitleConfig>(DEFAULT_CONFIG);
    const [aspectRatio, setAspectRatio] = useState('9:16');

    useEffect(() => {
        (async () => {
            try {
                const saved = await AsyncStorage.getItem(STORAGE_KEY);
                if (saved) setConfig(JSON.parse(saved));
                const ratio = await AsyncStorage.getItem(RATIO_KEY);
                if (ratio) setAspectRatio(ratio);
            } catch { }
        })();
    }, []);

    const handleNext = async () => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
            await AsyncStorage.setItem(RATIO_KEY, aspectRatio);
        } catch { }
        onNext(config, aspectRatio);
    };

    const colors_list: { value: SubtitleConfig['color']; label: string; swatch: string }[] = [
        { value: 'white', label: 'White', swatch: '#ffffff' },
        { value: 'yellow', label: 'Gold', swatch: '#D4AF37' },
        { value: 'black_outline', label: 'Outlined', swatch: '#333333' },
    ];

    const positions: { value: SubtitleConfig['position']; label: string; icon: string }[] = [
        { value: 'top', label: 'Top', icon: '↑' },
        { value: 'middle', label: 'Center', icon: '⬌' },
        { value: 'bottom', label: 'Bottom', icon: '↓' },
    ];

    const aspectRatios = [
        { value: '9:16', label: '9:16', desc: 'Shorts' },
        { value: '1:1', label: '1:1', desc: 'Square' },
        { value: '4:5', label: '4:5', desc: 'Portrait' },
        { value: '16:9', label: '16:9', desc: 'Wide' },
    ];

    return (
        <ScrollView style={commonStyles.screen} contentContainerStyle={commonStyles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={commonStyles.btnGhost}>
                    <Text style={commonStyles.btnGhostText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Subtitle Style</Text>
            </View>

            {/* Enable subtitles toggle */}
            <View style={[commonStyles.card, commonStyles.spaceBetween]}>
                <Text style={{ fontSize: 15, fontWeight: '500', color: colors.textPrimary }}>
                    Enable Subtitles
                </Text>
                <Switch
                    value={config.enabled}
                    onValueChange={v => setConfig({ ...config, enabled: v })}
                    trackColor={{ false: colors.bgSurfaceActive, true: colors.emerald }}
                    thumbColor={colors.white}
                />
            </View>

            {config.enabled && (
                <>
                    {/* Font Size */}
                    <View style={commonStyles.card}>
                        <View style={commonStyles.spaceBetween}>
                            <Text style={commonStyles.sectionTitle}>Arabic Font Size</Text>
                            <Text style={{ color: colors.emerald, fontWeight: '600' }}>{config.fontSize}px</Text>
                        </View>
                        <Slider
                            style={{ width: '100%', height: 40 }}
                            minimumValue={24}
                            maximumValue={72}
                            step={2}
                            value={config.fontSize}
                            onValueChange={v => setConfig({ ...config, fontSize: Math.round(v) })}
                            minimumTrackTintColor={colors.emerald}
                            maximumTrackTintColor={colors.borderSubtle}
                            thumbTintColor={colors.emerald}
                        />
                    </View>

                    {/* Color */}
                    <Text style={commonStyles.sectionTitle}>Text Color</Text>
                    <View style={styles.chipRow}>
                        {colors_list.map(c => (
                            <TouchableOpacity
                                key={c.value}
                                style={[commonStyles.chip, config.color === c.value && commonStyles.chipActive]}
                                onPress={() => setConfig({ ...config, color: c.value })}
                            >
                                <View style={styles.chipRow}>
                                    <View style={[styles.swatch, { backgroundColor: c.swatch, borderWidth: c.swatch === '#ffffff' ? 1 : 0, borderColor: colors.borderHover }]} />
                                    <Text style={[commonStyles.chipText, config.color === c.value && commonStyles.chipTextActive]}>
                                        {c.label}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Position */}
                    <Text style={commonStyles.sectionTitle}>Position</Text>
                    <View style={styles.chipRow}>
                        {positions.map(p => (
                            <TouchableOpacity
                                key={p.value}
                                style={[commonStyles.chip, config.position === p.value && commonStyles.chipActive]}
                                onPress={() => setConfig({ ...config, position: p.value })}
                            >
                                <Text style={[commonStyles.chipText, config.position === p.value && commonStyles.chipTextActive]}>
                                    {p.icon} {p.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Translation toggle */}
                    <View style={[commonStyles.card, { marginTop: spacing.sm }]}>
                        <View style={commonStyles.spaceBetween}>
                            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary }}>
                                English Translation
                            </Text>
                            <Switch
                                value={config.showTranslation}
                                onValueChange={v => setConfig({ ...config, showTranslation: v })}
                                trackColor={{ false: colors.bgSurfaceActive, true: colors.emerald }}
                                thumbColor={colors.white}
                            />
                        </View>
                        {config.showTranslation && (
                            <View style={{ marginTop: spacing.md }}>
                                <View style={commonStyles.spaceBetween}>
                                    <Text style={{ fontSize: 13, color: colors.textMuted }}>Translation Size</Text>
                                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.emerald }}>
                                        {config.translationFontSize}px
                                    </Text>
                                </View>
                                <Slider
                                    style={{ width: '100%', height: 40 }}
                                    minimumValue={12}
                                    maximumValue={36}
                                    step={2}
                                    value={config.translationFontSize}
                                    onValueChange={v => setConfig({ ...config, translationFontSize: Math.round(v) })}
                                    minimumTrackTintColor={colors.emerald}
                                    maximumTrackTintColor={colors.borderSubtle}
                                    thumbTintColor={colors.emerald}
                                />
                            </View>
                        )}
                    </View>

                    {/* Subtitle warning */}
                    <View style={commonStyles.warningBox}>
                        <Text style={{ color: colors.gold, fontSize: 13 }}>
                            ⚠ Subtitles increase processing time (video will be re-encoded)
                        </Text>
                    </View>
                </>
            )}

            {/* Aspect Ratio */}
            <Text style={commonStyles.sectionTitle}>Aspect Ratio</Text>
            <View style={styles.chipRow}>
                {aspectRatios.map(r => (
                    <TouchableOpacity
                        key={r.value}
                        style={[commonStyles.chip, aspectRatio === r.value && commonStyles.chipActive, styles.ratioChip]}
                        onPress={() => setAspectRatio(r.value)}
                    >
                        <Text style={[commonStyles.chipText, aspectRatio === r.value && commonStyles.chipTextActive, { fontWeight: '600', fontSize: 14 }]}>
                            {r.label}
                        </Text>
                        <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{r.desc}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity style={[commonStyles.btnPrimary, { marginTop: spacing.lg }]} onPress={handleNext}>
                <Text style={commonStyles.btnPrimaryText}>Next: Export Video →</Text>
            </TouchableOpacity>
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
        marginLeft: spacing.md,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: spacing.sm,
    },
    swatch: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: 6,
    },
    ratioChip: {
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: spacing.md,
    },
});
