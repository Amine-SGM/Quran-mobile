import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography, accessibility } from '~theme/tokens';
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
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            {/* Surah Header Card */}
            <View style={styles.headerCard}>
                <Text style={styles.arabicHeader}>{surah.arabicName}</Text>
                <Text style={styles.englishHeader}>{surah.englishName}</Text>
                <View style={styles.badgeRow}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{surah.totalAyahs} Ayahs</Text>
                    </View>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{surah.revelationType}</Text>
                    </View>
                </View>
            </View>

            {/* Selection Section */}
            <View style={styles.inputSection}>
                <Text style={styles.sectionTitle}>Define Verse Range</Text>
                <View style={styles.rangeContainer}>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>From Ayah</Text>
                        <TextInput 
                            style={styles.input} 
                            keyboardType="number-pad" 
                            value={startAyah} 
                            onChangeText={setStartAyah} 
                            selectionColor={colors.accentEmerald}
                        />
                    </View>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>To Ayah</Text>
                        <TextInput 
                            style={styles.input} 
                            keyboardType="number-pad" 
                            value={endAyah} 
                            onChangeText={setEndAyah} 
                            selectionColor={colors.accentEmerald}
                        />
                    </View>
                </View>

                {tooMany && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>⚠ Production Limit: {MAX_AYAHS_MOBILE} Ayahs per video on mobile.</Text>
                    </View>
                )}
            </View>

            {/* Bottom Actions */}
            <View style={styles.footer}>
                <Pressable 
                    onPress={handleNext} 
                    disabled={!isValid || tooMany}
                    style={({ pressed }) => [
                        styles.btnNext, 
                        (!isValid || tooMany) && styles.btnDisabled, 
                        pressed && styles.btnPressed
                    ]}
                    {...accessibility.minTouchTarget}
                >
                    <Text style={styles.btnText}>Continue to Reciters</Text>
                </Pressable>
                
                <Pressable onPress={onBack} style={styles.btnBack}>
                    <Text style={styles.btnBackText}>Change Surah</Text>
                </Pressable>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: colors.bgBase 
    },
    scrollContent: { 
        padding: spacing.lg, 
        gap: spacing.xl,
        paddingBottom: spacing['3xl'] 
    },
    headerCard: { 
        backgroundColor: colors.bgSurface, 
        padding: spacing.xl, 
        borderRadius: radius.lg, 
        alignItems: 'center', 
        gap: spacing.sm, 
        borderWidth: 1, 
        borderColor: colors.borderSubtle 
    },
    arabicHeader: { 
        ...typography.arabicH1, 
        color: colors.accentGold 
    },
    englishHeader: { 
        ...typography.h2, 
        color: colors.textPrimary 
    },
    badgeRow: { 
        flexDirection: 'row', 
        gap: spacing.xs 
    },
    badge: { 
        backgroundColor: colors.accentEmeraldGlow, 
        paddingHorizontal: spacing.sm, 
        paddingVertical: 4, 
        borderRadius: radius.full, 
        borderWidth: 1, 
        borderColor: colors.accentEmerald 
    },
    badgeText: { 
        ...typography.small, 
        color: colors.accentEmerald 
    },
    inputSection: { 
        gap: spacing.md 
    },
    sectionTitle: { 
        ...typography.h3, 
        color: colors.textSecondary 
    },
    rangeContainer: { 
        flexDirection: 'row', 
        gap: spacing.md 
    },
    inputWrapper: { 
        flex: 1, 
        gap: spacing.xs 
    },
    inputLabel: { 
        ...typography.small, 
        color: colors.textMuted 
    },
    input: { 
        backgroundColor: colors.bgSurface, 
        borderRadius: radius.md, 
        padding: spacing.md, 
        color: colors.textPrimary, 
        textAlign: 'center', 
        ...typography.h3, 
        borderWidth: 1, 
        borderColor: colors.borderSubtle 
    },
    errorBox: {
        backgroundColor: colors.errorGlow,
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.error,
    },
    errorText: { 
        ...typography.small, 
        color: colors.error, 
        textAlign: 'center' 
    },
    footer: {
        gap: spacing.md,
        marginTop: spacing.md
    },
    btnNext: { 
        backgroundColor: colors.accentEmerald, 
        padding: spacing.md, 
        borderRadius: radius.md, 
        alignItems: 'center' 
    },
    btnDisabled: { 
        opacity: 0.3 
    },
    btnPressed: { 
        backgroundColor: colors.accentEmeraldDim 
    },
    btnText: { 
        ...typography.body, 
        color: colors.white, 
        fontWeight: '700' 
    },
    btnBack: {
        padding: spacing.md,
        alignItems: 'center'
    },
    btnBackText: {
        ...typography.body,
        color: colors.textMuted
    }
});
