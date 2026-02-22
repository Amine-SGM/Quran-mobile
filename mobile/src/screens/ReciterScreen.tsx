// Reciter Screen — reciter selection
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
import { getReciters, Reciter } from '../services/quran-api';

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
            setError('Failed to load reciters: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredReciters = reciters.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderReciter = useCallback(
        ({ item }: { item: Reciter }) => (
            <TouchableOpacity
                style={[commonStyles.card, styles.reciterCard]}
                onPress={() => onSelectReciter(item)}
                activeOpacity={0.7}
            >
                <View style={commonStyles.row}>
                    {/* Avatar */}
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <Text style={styles.reciterName}>{item.name}</Text>
                        {item.style && (
                            <View style={styles.styleBadge}>
                                <Text style={styles.styleBadgeText}>{item.style}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={{ color: colors.textMuted, fontSize: 18 }}>→</Text>
                </View>
            </TouchableOpacity>
        ),
        [onSelectReciter]
    );

    if (loading) {
        return (
            <View style={[commonStyles.screen, commonStyles.center]}>
                <ActivityIndicator size="large" color={colors.emerald} />
                <Text style={{ color: colors.textSecondary, marginTop: spacing.md }}>Loading reciters…</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[commonStyles.screen, commonStyles.center, { padding: spacing.lg }]}>
                <Text style={{ color: colors.ruby, fontSize: 15, textAlign: 'center' }}>{error}</Text>
                <TouchableOpacity style={[commonStyles.btnSecondary, { marginTop: spacing.md }]} onPress={loadReciters}>
                    <Text style={commonStyles.btnSecondaryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={commonStyles.screen}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={commonStyles.btnGhost}>
                    <Text style={commonStyles.btnGhostText}>← Back</Text>
                </TouchableOpacity>
                <View style={{ marginLeft: spacing.md }}>
                    <Text style={styles.title}>Select Reciter</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                        {reciters.length} reciters available
                    </Text>
                </View>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search reciters…"
                    placeholderTextColor={colors.textMuted}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
            </View>

            {/* Reciter list */}
            <FlatList
                data={filteredReciters}
                keyExtractor={item => item.id}
                renderItem={renderReciter}
                contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
                ListEmptyComponent={
                    <View style={commonStyles.center}>
                        <Text style={{ color: colors.textMuted, marginTop: spacing.xl }}>
                            No reciters matching "{searchTerm}"
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
        alignItems: 'center',
        padding: spacing.md,
        paddingTop: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.textPrimary,
        letterSpacing: -0.3,
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
    reciterCard: {
        marginBottom: spacing.sm,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.emeraldGlow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.emerald,
    },
    reciterName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    styleBadge: {
        marginTop: 4,
        alignSelf: 'flex-start',
        backgroundColor: colors.goldSoft,
        borderRadius: radius.full,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    styleBadgeText: {
        fontSize: 11,
        color: colors.gold,
        fontWeight: '600',
    },
});
