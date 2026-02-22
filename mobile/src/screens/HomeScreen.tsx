// Home Screen — Surah selection with dark Islamic theme
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { colors, commonStyles, spacing, radius } from '../theme';
import { getChapters, Surah } from '../services/quran-api';

interface HomeScreenProps {
    onSelectSurah: (surah: Surah) => void;
    onOpenSettings: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectSurah, onOpenSettings }) => {
    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadSurahs();
    }, []);

    const loadSurahs = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getChapters('en');
            setSurahs(data);
        } catch (err: any) {
            setError('Failed to load Surahs: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredSurahs = surahs.filter(
        s =>
            (s.englishName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.number.toString().includes(searchTerm)
    );

    const renderSurah = useCallback(
        ({ item, index }: { item: Surah; index: number }) => (
            <TouchableOpacity
                style={[commonStyles.card, styles.surahCard]}
                onPress={() => onSelectSurah(item)}
                activeOpacity={0.7}
            >
                <View style={commonStyles.row}>
                    {/* Number badge */}
                    <View style={styles.numberBadge}>
                        <Text style={styles.numberText}>{item.number}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <Text style={styles.surahName}>{item.englishName}</Text>
                        <Text style={styles.surahMeta}>
                            {item.totalAyahs} verses · {item.revelationType}
                        </Text>
                    </View>
                    <Text style={styles.arabicName}>{item.arabicName}</Text>
                </View>
            </TouchableOpacity>
        ),
        [onSelectSurah]
    );

    if (loading) {
        return (
            <View style={[commonStyles.screen, commonStyles.center]}>
                <ActivityIndicator size="large" color={colors.emerald} />
                <Text style={{ color: colors.textSecondary, marginTop: spacing.md }}>Loading Surahs…</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[commonStyles.screen, commonStyles.center, { padding: spacing.lg }]}>
                <Text style={{ fontSize: 36 }}>⚠️</Text>
                <Text style={[styles.errorText, { marginTop: spacing.md }]}>{error}</Text>
                <TouchableOpacity style={[commonStyles.btnSecondary, { marginTop: spacing.md }]} onPress={loadSurahs}>
                    <Text style={commonStyles.btnSecondaryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={commonStyles.screen}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Select a Surah</Text>
                    <Text style={styles.subtitle}>Choose a chapter to create your video</Text>
                </View>
                <TouchableOpacity onPress={onOpenSettings} style={commonStyles.btnGhost}>
                    <Text style={{ fontSize: 22, color: colors.textSecondary }}>⚙️</Text>
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name or number…"
                    placeholderTextColor={colors.textMuted}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
            </View>

            {/* Surah list */}
            <FlatList
                data={filteredSurahs}
                keyExtractor={item => item.number.toString()}
                renderItem={renderSurah}
                contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
                ListEmptyComponent={
                    <View style={commonStyles.center}>
                        <Text style={{ color: colors.textMuted, marginTop: spacing.xl }}>
                            No Surahs matching "{searchTerm}"
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: spacing.md,
        paddingTop: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.textPrimary,
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: spacing.md,
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        paddingHorizontal: spacing.md,
    },
    searchIcon: {
        fontSize: 16,
        marginRight: spacing.sm,
    },
    searchInput: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: 14,
        paddingVertical: 12,
    },
    surahCard: {
        marginBottom: spacing.sm,
    },
    numberBadge: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: colors.emeraldGlow,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: '45deg' }],
    },
    numberText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.emerald,
        transform: [{ rotate: '-45deg' }],
    },
    surahName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    surahMeta: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2,
    },
    arabicName: {
        fontSize: 20,
        color: colors.textPrimary,
        marginLeft: spacing.sm,
    },
    errorText: {
        color: colors.ruby,
        fontSize: 15,
        fontWeight: '500',
        textAlign: 'center',
    },
});
