import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    Pressable,
    ActivityIndicator,
    StyleSheet,
    StatusBar,
} from 'react-native';
import { colors, spacing, radius, typography, accessibility } from '~theme/tokens';
import { getChapters, Surah } from '~api/quran-api';

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

    const filteredSurahs = useMemo(() => 
        surahs.filter(s =>
            (s.englishName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.number.toString().includes(searchTerm)
        ),
        [surahs, searchTerm]
    );

    const renderSurah = useCallback(({ item }: { item: Surah }) => (
        <Pressable
            style={({ pressed }) => [
                styles.surahCard,
                pressed && styles.surahCardPressed
            ]}
            onPress={() => onSelectSurah(item)}
            {...accessibility.minTouchTarget}
        >
            <View style={styles.cardContent}>
                <View style={styles.numberContainer}>
                    <Text style={styles.numberText}>{item.number}</Text>
                </View>
                
                <View style={styles.infoContainer}>
                    <Text style={styles.englishName}>{item.englishName}</Text>
                    <Text style={styles.metaText}>
                        {item.totalAyahs} Verses • {item.revelationType}
                    </Text>
                </View>

                <Text style={styles.arabicName}>{item.arabicName}</Text>
            </View>
        </Pressable>
    ), [onSelectSurah]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.accentEmerald} />
                <Text style={styles.loadingText}>Unveiling Chapters...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={{ fontSize: 48 }}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable style={styles.retryBtn} onPress={loadSurahs}>
                    <Text style={styles.retryBtnText}>Retry Connection</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <View style={styles.header}>
                <View style={styles.headerTextGroup}>
                    <Text style={styles.title}>The Noble Qur'an</Text>
                    <Text style={styles.subtitle}>Select a Surah to begin creation</Text>
                </View>
                <Pressable onPress={onOpenSettings} style={styles.settingsBtn}>
                    <Text style={styles.settingsIcon}>⚙️</Text>
                </Pressable>
            </View>

            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or number..."
                        placeholderTextColor={colors.textMuted}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        selectionColor={colors.accentEmerald}
                    />
                </View>
            </View>

            <FlatList
                data={filteredSurahs}
                keyExtractor={item => item.number.toString()}
                renderItem={renderSurah}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text style={styles.emptyText}>No results found for "{searchTerm}"</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgBase,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing['2xl'],
        paddingBottom: spacing.md,
    },
    headerTextGroup: {
        gap: spacing['2xs'],
    },
    title: {
        ...typography.h1,
        color: colors.textPrimary,
    },
    subtitle: {
        ...typography.small,
        color: colors.textSecondary,
    },
    settingsBtn: {
        padding: spacing.xs,
    },
    settingsIcon: {
        fontSize: 24,
        color: colors.textSecondary,
    },
    searchSection: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        height: 52,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        gap: spacing.xs,
    },
    searchIcon: {
        fontSize: 16,
    },
    searchInput: {
        flex: 1,
        ...typography.body,
        color: colors.textPrimary,
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing['3xl'],
        gap: spacing.sm,
    },
    surahCard: {
        backgroundColor: colors.glassBase,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        padding: spacing.md,
    },
    surahCardPressed: {
        backgroundColor: colors.glassElevated,
        borderColor: colors.borderFocus,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    numberContainer: {
        width: 40,
        height: 40,
        borderRadius: radius.sm,
        backgroundColor: colors.accentGoldGlow,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.accentGold,
    },
    numberText: {
        ...typography.small,
        color: colors.accentGold,
        fontWeight: 'bold',
    },
    infoContainer: {
        flex: 1,
        gap: 2,
    },
    englishName: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    metaText: {
        ...typography.small,
        color: colors.textMuted,
    },
    arabicName: {
        ...typography.arabicBody,
        color: colors.accentGold,
    },
    loadingText: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
    emptyText: {
        ...typography.body,
        color: colors.textMuted,
    },
    errorText: {
        ...typography.body,
        color: colors.error,
        textAlign: 'center',
        marginTop: spacing.md,
    },
    retryBtn: {
        marginTop: spacing.lg,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.md,
        backgroundColor: colors.bgSurfaceElevated,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    retryBtnText: {
        ...typography.body,
        color: colors.textPrimary,
        fontWeight: '600',
    },
});
