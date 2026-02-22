// Surah Detail Screen — Ayah range selection
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { colors, commonStyles, spacing, radius } from '../theme';
import { Surah } from '~api/quran-api';

const MAX_AYAHS_MOBILE = 10;

interface SurahDetailScreenProps {
    surah: Surah;
    onNext: (start: number, end: number) => void;
    onBack: () => void;
}

export const SurahDetailScreen: React.FC<SurahDetailScreenProps> = ({ surah, onNext, onBack }) => {
    const [startAyah, setStartAyah] = useState('1');
    const [endAyah, setEndAyah] = useState(String(Math.min(MAX_AYAHS_MOBILE, surah.totalAyahs)));

    const start = parseInt(startAyah) || 1;
    const end = parseInt(endAyah) || 1;
    const count = end - start + 1;
    const isValid = start >= 1 && end <= surah.totalAyahs && start <= end;
    const tooMany = isValid && count > MAX_AYAHS_MOBILE;

    const handleNext = () => {
        if (isValid && !tooMany) {
            onNext(start, end);
        }
    };

    return (
        <ScrollView style={commonStyles.screen} contentContainerStyle={commonStyles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={commonStyles.btnGhost}>
                    <Text style={commonStyles.btnGhostText}>← Back</Text>
                </TouchableOpacity>
                <View style={{ marginLeft: spacing.md }}>
                    <Text style={styles.title}>{surah.englishName}</Text>
                    <Text style={styles.arabicName}>{surah.arabicName}</Text>
                </View>
            </View>

            {/* Surah info card */}
            <View style={[commonStyles.card, styles.infoCard]}>
                <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoValue}>{surah.number}</Text>
                        <Text style={styles.infoLabel}>SURAH</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoItem}>
                        <Text style={styles.infoValue}>{surah.totalAyahs}</Text>
                        <Text style={styles.infoLabel}>AYAHS</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoItem}>
                        <Text style={[styles.infoValue, { color: colors.gold, fontSize: 14 }]}>
                            {surah.revelationType}
                        </Text>
                        <Text style={styles.infoLabel}>ORIGIN</Text>
                    </View>
                </View>
            </View>

            {/* Range inputs */}
            <Text style={commonStyles.sectionTitle}>Select Ayah Range</Text>
            <View style={commonStyles.card}>
                <View style={styles.rangeRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.rangeLabel}>Start Ayah</Text>
                        <TextInput
                            style={[commonStyles.input, styles.rangeInput]}
                            keyboardType="number-pad"
                            value={startAyah}
                            onChangeText={setStartAyah}
                            maxLength={3}
                        />
                    </View>
                    <Text style={styles.arrow}>→</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.rangeLabel}>End Ayah</Text>
                        <TextInput
                            style={[commonStyles.input, styles.rangeInput]}
                            keyboardType="number-pad"
                            value={endAyah}
                            onChangeText={setEndAyah}
                            maxLength={3}
                        />
                    </View>
                </View>

                {/* Summary */}
                {isValid && !tooMany && (
                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryText}>
                            {count} ayah{count > 1 ? 's' : ''} selected
                        </Text>
                    </View>
                )}
            </View>

            {/* Validation errors */}
            {start > end && (
                <View style={commonStyles.errorBox}>
                    <Text style={{ color: colors.ruby, fontSize: 14 }}>⚠ Start must be ≤ End</Text>
                </View>
            )}
            {tooMany && (
                <View style={commonStyles.warningBox}>
                    <Text style={{ color: colors.gold, fontSize: 14 }}>
                        ⚠ Max {MAX_AYAHS_MOBILE} ayahs on mobile (currently {count})
                    </Text>
                </View>
            )}

            <TouchableOpacity
                style={[commonStyles.btnPrimary, { marginTop: spacing.md }, (!isValid || tooMany) && { opacity: 0.4 }]}
                onPress={handleNext}
                disabled={!isValid || tooMany}
            >
                <Text style={commonStyles.btnPrimaryText}>Next: Select Reciter →</Text>
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
        letterSpacing: -0.3,
    },
    arabicName: {
        fontSize: 18,
        color: colors.textSecondary,
        marginTop: 2,
    },
    infoCard: {
        marginBottom: spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    infoItem: {
        alignItems: 'center',
        flex: 1,
    },
    infoValue: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.emerald,
    },
    infoLabel: {
        fontSize: 10,
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginTop: 4,
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: colors.borderSubtle,
    },
    rangeRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: spacing.sm,
    },
    rangeLabel: {
        fontSize: 13,
        color: colors.textMuted,
        fontWeight: '500',
        marginBottom: spacing.sm,
    },
    rangeInput: {
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '600',
    },
    arrow: {
        color: colors.textMuted,
        fontSize: 18,
        paddingBottom: 12,
        paddingHorizontal: spacing.xs,
    },
    summaryBox: {
        marginTop: spacing.md,
        padding: spacing.sm,
        backgroundColor: colors.emeraldGlow,
        borderRadius: radius.sm,
        alignItems: 'center',
    },
    summaryText: {
        fontSize: 14,
        color: colors.emerald,
        fontWeight: '500',
    },
});
