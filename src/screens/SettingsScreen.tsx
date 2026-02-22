// Settings Screen
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
    StyleSheet,
    Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, commonStyles, spacing, radius } from '../theme';
import { clearAudioCache } from '../services/audio-cache';
import { clearVideoCache } from '../services/video-cache';

interface SettingsScreenProps {
    onBack: () => void;
}

const RESOLUTION_OPTIONS = ['720p', '1080p'] as const;
type Resolution = typeof RESOLUTION_OPTIONS[number];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
    const [pexelsApiKey, setPexelsApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [mobileResolution, setMobileResolution] = useState<Resolution>('720p');
    const [autoCleanup, setAutoCleanup] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            const key = await AsyncStorage.getItem('pexelsApiKey');
            const res = await AsyncStorage.getItem('mobileResolution');
            const cleanup = await AsyncStorage.getItem('autoCleanup');
            if (key) setPexelsApiKey(key);
            if (res) setMobileResolution(res as Resolution);
            if (cleanup !== null) setAutoCleanup(cleanup === 'true');
        })();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await AsyncStorage.setItem('pexelsApiKey', pexelsApiKey.trim());
            await AsyncStorage.setItem('mobileResolution', mobileResolution);
            await AsyncStorage.setItem('autoCleanup', String(autoCleanup));
            Alert.alert('Saved', 'Settings saved successfully.');
        } catch {
            Alert.alert('Error', 'Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleClearCache = async () => {
        Alert.alert(
            'Clear Cache',
            'This will delete all cached audio and video files. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        await clearAudioCache();
                        await clearVideoCache();
                        Alert.alert('Done', 'Cache cleared.');
                    },
                },
            ]
        );
    };

    return (
        <ScrollView style={commonStyles.screen} contentContainerStyle={commonStyles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={commonStyles.btnGhost}>
                    <Text style={commonStyles.btnGhostText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Settings</Text>
            </View>

            {/* Pexels API Key */}
            <Text style={commonStyles.sectionTitle}>Pexels API Key</Text>
            <View style={commonStyles.card}>
                <Text style={styles.settingDesc}>
                    Required for stock video search.{' '}
                    <Text
                        style={{ color: colors.emerald, textDecorationLine: 'underline' }}
                        onPress={() => Linking.openURL('https://www.pexels.com/api/')}
                    >
                        Get a free key →
                    </Text>
                </Text>
                <View style={styles.apiKeyRow}>
                    <TextInput
                        style={[commonStyles.input, { flex: 1 }]}
                        value={pexelsApiKey}
                        onChangeText={setPexelsApiKey}
                        placeholder="Paste your Pexels API key…"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry={!showApiKey}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TouchableOpacity
                        style={styles.showHideBtn}
                        onPress={() => setShowApiKey(v => !v)}
                    >
                        <Text style={{ color: colors.textMuted, fontSize: 18 }}>
                            {showApiKey ? '🙈' : '👁️'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Export Resolution */}
            <Text style={commonStyles.sectionTitle}>Export Resolution</Text>
            <View style={styles.chipRow}>
                {RESOLUTION_OPTIONS.map(r => (
                    <TouchableOpacity
                        key={r}
                        style={[commonStyles.chip, mobileResolution === r && commonStyles.chipActive]}
                        onPress={() => setMobileResolution(r)}
                    >
                        <Text style={[commonStyles.chipText, mobileResolution === r && commonStyles.chipTextActive]}>
                            {r}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            <Text style={styles.hint}>720p is faster; 1080p gives higher quality output.</Text>

            {/* Auto-cleanup */}
            <Text style={commonStyles.sectionTitle}>Cache</Text>
            <View style={[commonStyles.card, commonStyles.spaceBetween]}>
                <View>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary }}>
                        Auto-cleanup cache
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                        Delete audio/video files after 3 hours
                    </Text>
                </View>
                <Switch
                    value={autoCleanup}
                    onValueChange={setAutoCleanup}
                    trackColor={{ false: colors.bgSurfaceActive, true: colors.emerald }}
                    thumbColor={colors.white}
                />
            </View>

            <TouchableOpacity
                style={[commonStyles.btnSecondary, { marginTop: spacing.sm }]}
                onPress={handleClearCache}
            >
                <Text style={[commonStyles.btnSecondaryText, { color: colors.ruby }]}>🗑 Clear Cache Now</Text>
            </TouchableOpacity>

            {/* Save button */}
            <TouchableOpacity
                style={[commonStyles.btnPrimary, { marginTop: spacing.xl }]}
                onPress={handleSave}
                disabled={saving}
            >
                <Text style={commonStyles.btnPrimaryText}>{saving ? 'Saving…' : 'Save Settings'}</Text>
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
    settingDesc: {
        fontSize: 13,
        color: colors.textMuted,
        marginBottom: spacing.sm,
        lineHeight: 18,
    },
    apiKeyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    showHideBtn: {
        padding: spacing.sm,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: spacing.sm,
    },
    hint: {
        fontSize: 12,
        color: colors.textMuted,
        marginBottom: spacing.md,
    },
});
