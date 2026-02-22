// App shell — React Navigation stack with dark theme
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './screens/HomeScreen';
import { SurahDetailScreen } from './screens/SurahDetailScreen';
import { ReciterScreen } from './screens/ReciterScreen';
import { VideoSourceScreen } from './screens/VideoSourceScreen';
import { SubtitleConfigScreen, SubtitleConfig } from './screens/SubtitleConfigScreen';
import { ExportScreen } from './screens/ExportScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { colors } from './theme';
import { cleanupOldCache } from './services/audio-cache';
import { Surah, Reciter } from './services/quran-api';

interface VideoSource {
    type: 'upload' | 'stock';
    localPath: string;
    attribution?: string;
    thumbnailUrl?: string;
}

export type RootStackParamList = {
    Home: undefined;
    SurahDetail: { surah: Surah };
    Reciter: { surah: Surah; ayahStart: number; ayahEnd: number };
    VideoSource: { surah: Surah; ayahStart: number; ayahEnd: number; reciter: Reciter };
    SubtitleConfig: {
        surah: Surah;
        ayahStart: number;
        ayahEnd: number;
        reciter: Reciter;
        videoSource: VideoSource;
    };
    Export: {
        surah: Surah;
        ayahStart: number;
        ayahEnd: number;
        reciter: Reciter;
        videoSource: VideoSource;
        subtitleConfig: SubtitleConfig;
        aspectRatio: string;
    };
    Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const darkNavTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: colors.bgPrimary,
        card: colors.bgSecondary,
        text: colors.textPrimary,
        border: colors.borderSubtle,
        primary: colors.emerald,
        notification: colors.emerald,
    },
};

export const App: React.FC = () => {
    useEffect(() => {
        // Clean up stale cache on app start
        cleanupOldCache().catch(() => { });
    }, []);

    return (
        <NavigationContainer theme={darkNavTheme}>
            <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />
            <Stack.Navigator
                screenOptions={{
                    headerStyle: { backgroundColor: colors.bgSecondary },
                    headerTintColor: colors.textPrimary,
                    headerTitleStyle: { fontWeight: '600', fontSize: 16 },
                    headerShadowVisible: false,
                    contentStyle: { backgroundColor: colors.bgPrimary },
                    animation: 'slide_from_right',
                }}
            >
                <Stack.Screen
                    name="Home"
                    options={{ headerShown: false }}
                >
                    {({ navigation }) => (
                        <HomeScreen
                            onSelectSurah={surah => navigation.navigate('SurahDetail', { surah })}
                            onOpenSettings={() => navigation.navigate('Settings')}
                        />
                    )}
                </Stack.Screen>

                <Stack.Screen
                    name="SurahDetail"
                    options={{ title: 'Select Ayahs' }}
                >
                    {({ navigation, route }) => (
                        <SurahDetailScreen
                            surah={route.params.surah}
                            onNext={(start, end) =>
                                navigation.navigate('Reciter', {
                                    surah: route.params.surah,
                                    ayahStart: start,
                                    ayahEnd: end,
                                })
                            }
                            onBack={() => navigation.goBack()}
                        />
                    )}
                </Stack.Screen>

                <Stack.Screen
                    name="Reciter"
                    options={{ title: 'Select Reciter' }}
                >
                    {({ navigation, route }) => (
                        <ReciterScreen
                            onSelectReciter={reciter =>
                                navigation.navigate('VideoSource', {
                                    surah: route.params.surah,
                                    ayahStart: route.params.ayahStart,
                                    ayahEnd: route.params.ayahEnd,
                                    reciter,
                                })
                            }
                            onBack={() => navigation.goBack()}
                        />
                    )}
                </Stack.Screen>

                <Stack.Screen
                    name="VideoSource"
                    options={{ title: 'Select Video' }}
                >
                    {({ navigation, route }) => (
                        <VideoSourceScreen
                            onSelectVideo={videoSource =>
                                navigation.navigate('SubtitleConfig', {
                                    surah: route.params.surah,
                                    ayahStart: route.params.ayahStart,
                                    ayahEnd: route.params.ayahEnd,
                                    reciter: route.params.reciter,
                                    videoSource,
                                })
                            }
                            onBack={() => navigation.goBack()}
                        />
                    )}
                </Stack.Screen>

                <Stack.Screen
                    name="SubtitleConfig"
                    options={{ title: 'Subtitle Style' }}
                >
                    {({ navigation, route }) => (
                        <SubtitleConfigScreen
                            onNext={(subtitleConfig, aspectRatio) =>
                                navigation.navigate('Export', {
                                    surah: route.params.surah,
                                    ayahStart: route.params.ayahStart,
                                    ayahEnd: route.params.ayahEnd,
                                    reciter: route.params.reciter,
                                    videoSource: route.params.videoSource,
                                    subtitleConfig,
                                    aspectRatio,
                                })
                            }
                            onBack={() => navigation.goBack()}
                        />
                    )}
                </Stack.Screen>

                <Stack.Screen
                    name="Export"
                    options={{ title: 'Export', headerBackVisible: false }}
                >
                    {({ navigation, route }) => (
                        <ExportScreen
                            surah={route.params.surah}
                            reciter={route.params.reciter}
                            ayahStart={route.params.ayahStart}
                            ayahEnd={route.params.ayahEnd}
                            videoSource={route.params.videoSource}
                            subtitleConfig={route.params.subtitleConfig}
                            aspectRatio={route.params.aspectRatio}
                            onBack={() => navigation.goBack()}
                            onHome={() => navigation.popToTop()}
                        />
                    )}
                </Stack.Screen>

                <Stack.Screen
                    name="Settings"
                    options={{ title: 'Settings' }}
                >
                    {({ navigation }) => (
                        <SettingsScreen onBack={() => navigation.goBack()} />
                    )}
                </Stack.Screen>
            </Stack.Navigator>
        </NavigationContainer>
    );
};
