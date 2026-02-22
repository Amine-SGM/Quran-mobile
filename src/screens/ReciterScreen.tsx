import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    Pressable,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { colors, spacing, radius, typography, accessibility } from '~theme/tokens';
import { getReciters, Reciter } from '~api/quran-api';

interface ReciterScreenProps {
    onSelectReciter: (reciter: Reciter) => void;
    onBack: () => void;
}

export const ReciterScreen: React.FC<ReciterScreenProps> = ({ onSelectReciter, onBack }) => {
    const [reciters, setReciters] = useState<Reciter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadReciters();
    }, []);

    const loadReciters = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getReciters('en');
            setReciters(data);
        } catch (err: any) {
            setError('Failed to load voices: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredReciters = reciters.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderReciter = useCallback(
        ({ item }: { item: Reciter }) => (
            <Pressable
                style={({ pressed }) => [
                    styles.reciterCard,
                    pressed && styles.reciterCardPressed
                ]}
                onPress={() => onSelectReciter(item)}
                {...accessibility.minTouchTarget}
            >
                <View style={styles.cardContent}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.infoContainer}>
                        <Text style={styles.reciterName}>{item.name}</Text>
                        {item.style ? (
                            <View style={styles.styleBadge}>
                                <Text style={styles.styleBadgeText}>{item.style}</Text>
                            </View>
                        ) : (
                            <Text style={styles.metaText}>Classic Recitation</Text>
                        )}
                    </View>
                    <Text style={styles.chevron}>→</Text>
                </View>
            </Pressable>
        ),
        [onSelectReciter]
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.accentEmerald} />
                <Text style={styles.loadingText}>Summoning Voices...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={onBack} style={styles.backBtn}>
                    <Text style={styles.backIcon}>←</Text>
                </Pressable>
                <View style={styles.headerTextGroup}>
                    <Text style={styles.title}>Select Voice</Text>
                    <Text style={styles.subtitle}>{reciters.length} celestial reciters available</Text>
                </View>
            </View>

            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search reciters..."
                        placeholderTextColor={colors.textMuted}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        selectionColor={colors.accentEmerald}
                    />
                </View>
            </View>

            <FlatList
                data={filteredReciters}
                keyExtractor={item => item.id}
                renderItem={renderReciter}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text style={styles.emptyText}>No voices found matching "{searchTerm}"</Text>
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
    headerTextGroup: {
        gap: 2,
    },
    title: {
        ...typography.h2,
        color: colors.textPrimary,
    },
    subtitle: {
        ...typography.small,
        color: colors.textMuted,
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
    reciterCard: {
        backgroundColor: colors.glassBase,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        padding: spacing.md,
    },
    reciterCardPressed: {
        backgroundColor: colors.glassElevated,
        borderColor: colors.borderFocus,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.accentEmeraldGlow,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.accentEmerald,
    },
    avatarText: {
        ...typography.h3,
        color: colors.accentEmerald,
        fontWeight: 'bold',
    },
    infoContainer: {
        flex: 1,
        gap: 2,
    },
    reciterName: {
        ...typography.bodyLg,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    metaText: {
        ...typography.small,
        color: colors.textMuted,
    },
    styleBadge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.accentGoldGlow,
        borderRadius: radius.full,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderWidth: 0.5,
        borderColor: colors.accentGold,
    },
    styleBadgeText: {
        fontSize: 10,
        color: colors.accentGold,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    chevron: {
        color: colors.textMuted,
        fontSize: 18,
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
});
