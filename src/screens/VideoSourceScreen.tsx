// Video Source Screen — Upload from gallery or search Pexels stock videos
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Alert,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, commonStyles, spacing, radius } from '../theme';
import { searchVideos, getBestVideoUrl, getAttribution, PexelsVideoHit } from '~api/pexels-client';
import { downloadVideo } from '../services/video-cache';

interface VideoSource {
    type: 'upload' | 'stock';
    localPath: string;
    attribution?: string;
    thumbnailUrl?: string;
}

interface VideoSourceScreenProps {
    onSelectVideo: (source: VideoSource) => void;
    onBack: () => void;
}

export const VideoSourceScreen: React.FC<VideoSourceScreenProps> = ({ onSelectVideo, onBack }) => {
    const [activeTab, setActiveTab] = useState<'upload' | 'stock'>('upload');
    const [searchQuery, setSearchQuery] = useState('nature');
    const [searchResults, setSearchResults] = useState<PexelsVideoHit[]>([]);
    const [searching, setSearching] = useState(false);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [searchError, setSearchError] = useState<string | null>(null);

    const handleUpload = async () => {
        const result = await launchImageLibrary({
            mediaType: 'video',
            quality: 1,
        });
        if (result.assets && result.assets[0]?.uri) {
            const asset = result.assets[0];
            onSelectVideo({
                type: 'upload',
                localPath: asset.uri!,
                thumbnailUrl: undefined,
            });
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        try {
            setSearching(true);
            setSearchError(null);
            const apiKey = await AsyncStorage.getItem('pexelsApiKey');
            if (!apiKey) {
                setSearchError('Please add your Pexels API key in Settings first.');
                return;
            }
            const results = await searchVideos(apiKey, searchQuery, 20);
            setSearchResults(results.videos || []);
        } catch (err: any) {
            setSearchError('Search failed: ' + err.message);
        } finally {
            setSearching(false);
        }
    };

    const handleSelectStock = async (video: PexelsVideoHit) => {
        try {
            const videoUrl = getBestVideoUrl(video);
            if (!videoUrl) {
                Alert.alert('Error', 'No downloadable video found.');
                return;
            }
            setDownloading(video.id.toString());
            setDownloadProgress(0);
            const localPath = await downloadVideo(
                videoUrl,
                video.id.toString(),
                (pct) => setDownloadProgress(pct)
            );
            const attribution = getAttribution(video);
            onSelectVideo({
                type: 'stock',
                localPath,
                attribution,
                thumbnailUrl: video.image,
            });
        } catch (err: any) {
            Alert.alert('Download Failed', err.message);
        } finally {
            setDownloading(null);
        }
    };

    const renderStockVideo = ({ item }: { item: any }) => {
        const isDownloading = downloading === item.id.toString();
        return (
            <TouchableOpacity
                style={styles.stockCard}
                onPress={() => handleSelectStock(item)}
                disabled={!!downloading}
                activeOpacity={0.8}
            >
                <Image source={{ uri: item.image }} style={styles.thumbnail} resizeMode="cover" />
                <View style={styles.stockOverlay}>
                    {isDownloading ? (
                        <View style={styles.downloadingBadge}>
                            <ActivityIndicator size="small" color={colors.white} />
                            <Text style={styles.downloadingText}>{downloadProgress}%</Text>
                        </View>
                    ) : (
                        <View style={styles.durationBadge}>
                            <Text style={styles.durationText}>{item.duration}s</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.stockAuthor} numberOfLines={1}>
                    {getAttribution(item)}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={commonStyles.screen}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={commonStyles.btnGhost}>
                    <Text style={commonStyles.btnGhostText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Select Video</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabBar}>
                {(['upload', 'stock'] as const).map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                            {tab === 'upload' ? '📁 Upload' : '🎬 Stock (Pexels)'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {activeTab === 'upload' ? (
                <View style={[commonStyles.center, { flex: 1, padding: spacing.lg }]}>
                    <Text style={{ fontSize: 48 }}>🎥</Text>
                    <Text style={[styles.uploadTitle, { marginTop: spacing.md }]}>Upload a Video</Text>
                    <Text style={styles.uploadSubtitle}>MP4, MOV, or WEBM from your gallery</Text>
                    <TouchableOpacity
                        style={[commonStyles.btnPrimary, { marginTop: spacing.lg, paddingHorizontal: spacing.xl }]}
                        onPress={handleUpload}
                    >
                        <Text style={commonStyles.btnPrimaryText}>Choose from Gallery</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {/* Search bar */}
                    <View style={styles.searchRow}>
                        <TextInput
                            style={[commonStyles.input, { flex: 1, marginRight: spacing.sm }]}
                            placeholder="Search videos (e.g. nature, mosque)"
                            placeholderTextColor={colors.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                        />
                        <TouchableOpacity
                            style={[commonStyles.btnPrimary, { paddingHorizontal: spacing.md }]}
                            onPress={handleSearch}
                            disabled={searching}
                        >
                            {searching ? (
                                <ActivityIndicator size="small" color={colors.white} />
                            ) : (
                                <Text style={commonStyles.btnPrimaryText}>Search</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {searchError && (
                        <View style={[commonStyles.errorBox, { margin: spacing.md }]}>
                            <Text style={{ color: colors.ruby, fontSize: 13 }}>{searchError}</Text>
                        </View>
                    )}

                    {searchResults.length === 0 && !searching && !searchError && (
                        <View style={[commonStyles.center, { flex: 1 }]}>
                            <Text style={{ fontSize: 36 }}>🔍</Text>
                            <Text style={{ color: colors.textMuted, marginTop: spacing.md }}>
                                Search for free stock videos
                            </Text>
                            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
                                Powered by Pexels
                            </Text>
                        </View>
                    )}

                    <FlatList
                        data={searchResults}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderStockVideo}
                        numColumns={2}
                        contentContainerStyle={{ padding: spacing.sm, paddingBottom: spacing.xxl }}
                        columnWrapperStyle={{ gap: spacing.sm }}
                    />
                </View>
            )}
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
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
        marginLeft: spacing.md,
    },
    tabBar: {
        flexDirection: 'row',
        margin: spacing.md,
        backgroundColor: colors.bgSurface,
        borderRadius: radius.md,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: radius.sm,
    },
    tabActive: {
        backgroundColor: colors.bgSurfaceActive,
    },
    tabText: {
        fontSize: 13,
        color: colors.textMuted,
        fontWeight: '500',
    },
    tabTextActive: {
        color: colors.textPrimary,
        fontWeight: '600',
    },
    uploadTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    uploadSubtitle: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 4,
    },
    searchRow: {
        flexDirection: 'row',
        padding: spacing.md,
        alignItems: 'center',
    },
    stockCard: {
        flex: 1,
        borderRadius: radius.md,
        overflow: 'hidden',
        backgroundColor: colors.bgSurface,
        marginBottom: spacing.sm,
    },
    thumbnail: {
        width: '100%',
        aspectRatio: 9 / 16,
    },
    stockOverlay: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
    },
    durationBadge: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: radius.full,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    durationText: {
        color: colors.white,
        fontSize: 11,
        fontWeight: '600',
    },
    downloadingBadge: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: radius.full,
        paddingHorizontal: 8,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    downloadingText: {
        color: colors.white,
        fontSize: 11,
        fontWeight: '600',
    },
    stockAuthor: {
        fontSize: 10,
        color: colors.textMuted,
        padding: 6,
        backgroundColor: colors.bgSurface,
    },
});
