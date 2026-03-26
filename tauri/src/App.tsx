import { useState } from "react";
import type { Surah, AspectRatio, Resolution, VideoSource, SubtitleConfig, Reciter } from "./types";
import { HomeScreen } from "./screens/HomeScreen";
import { SurahDetailScreen } from "./screens/SurahDetailScreen";
import { ReciterScreen } from "./screens/ReciterScreen";
import { OutputSettingsScreen } from "./screens/OutputSettingsScreen";
import { VideoSourceScreen } from "./screens/VideoSourceScreen";
import { StockVideoScreen } from "./screens/StockVideoScreen";
import { SubtitleConfigScreen } from "./screens/SubtitleConfigScreen";
import { ExportScreen } from "./screens/ExportScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { ToastContainer } from "./components/Toast";
import { useToast } from "./hooks/useToast";
import "./App.css";

type Screen = "home" | "surahDetail" | "reciter" | "outputSettings" | "videoSource" | "stockVideo" | "subtitleConfig" | "export" | "settings";

interface NavigationState {
  screen: Screen;
  selectedSurah: Surah | null;
  ayahRangeStart: number | null;
  ayahRangeEnd: number | null;
  selectedReciterId: number | null;
  reciters: Reciter[];
  aspectRatio: AspectRatio | null;
  resolution: Resolution | null;
  videoSource: VideoSource | null;
  subtitleConfig: SubtitleConfig | null;
}

function App() {
  const toast = useToast();
  const [nav, setNav] = useState<NavigationState>({
    screen: "home",
    selectedSurah: null,
    ayahRangeStart: null,
    ayahRangeEnd: null,
    selectedReciterId: null,
    reciters: [],
    aspectRatio: null,
    resolution: null,
    videoSource: null,
    subtitleConfig: null,
  });

  const handleSurahSelect = (surah: Surah) => {
    setNav({
      screen: "surahDetail",
      selectedSurah: surah,
      ayahRangeStart: null,
      ayahRangeEnd: null,
      selectedReciterId: null,
      reciters: [],
      aspectRatio: null,
      resolution: null,
      videoSource: null,
      subtitleConfig: null,
    });
  };

  const handleBackToHome = () => {
    setNav({
      screen: "home",
      selectedSurah: null,
      ayahRangeStart: null,
      ayahRangeEnd: null,
      selectedReciterId: null,
      reciters: [],
      aspectRatio: null,
      resolution: null,
      videoSource: null,
      subtitleConfig: null,
    });
  };

  const handleContinueToReciter = (
    _surahNumber: number,
    ayahStart: number,
    ayahEnd: number
  ) => {
    if (!nav.selectedSurah || ayahStart < 1 || ayahEnd < ayahStart) return;
    setNav((prev) => ({
      ...prev,
      screen: "reciter",
      ayahRangeStart: ayahStart,
      ayahRangeEnd: ayahEnd,
    }));
  };

  const handleBackToSurahDetail = () => {
    setNav((prev) => ({
      ...prev,
      screen: "surahDetail",
      selectedReciterId: null,
    }));
  };

  const handleContinueToOutputSettings = (reciterId: number) => {
    if (!nav.selectedSurah || nav.ayahRangeStart == null || nav.ayahRangeEnd == null) return;
    setNav((prev) => ({
      ...prev,
      screen: "outputSettings",
      selectedReciterId: reciterId,
    }));
  };

  const handleRecitersLoaded = (reciters: Reciter[]) => {
    setNav((prev) => ({ ...prev, reciters }));
  };

  const handleBackToReciter = () => {
    setNav((prev) => ({
      ...prev,
      screen: "reciter",
      aspectRatio: null,
      resolution: null,
    }));
  };

  const handleContinueToVideoSource = (
    aspectRatio: AspectRatio,
    resolution: Resolution
  ) => {
    if (!nav.selectedSurah || nav.selectedReciterId == null) return;
    setNav((prev) => ({
      ...prev,
      screen: "videoSource",
      aspectRatio,
      resolution,
    }));
  };

  const handleBackToOutputSettings = () => {
    setNav((prev) => ({
      ...prev,
      screen: "outputSettings",
      videoSource: null,
    }));
  };

  const handleContinueToSubtitleConfig = (videoSource: VideoSource) => {
    if (!nav.selectedSurah || nav.aspectRatio == null || nav.resolution == null) return;
    setNav((prev) => ({
      ...prev,
      screen: "subtitleConfig",
      videoSource,
    }));
  };

  const handleBackFromSubtitleConfig = () => {
    setNav((prev) => ({
      ...prev,
      screen: "videoSource",
      subtitleConfig: null,
    }));
  };

  const handleContinueToExport = (config: SubtitleConfig) => {
    if (!nav.selectedSurah || nav.videoSource == null) return;
    setNav((prev) => ({
      ...prev,
      screen: "export",
      subtitleConfig: config,
    }));
  };

  const handleStockVideo = () => {
    setNav((prev) => ({
      ...prev,
      screen: "stockVideo",
    }));
  };

  const handleBackToVideoSource = () => {
    setNav((prev) => ({
      ...prev,
      screen: "videoSource",
    }));
  };

  const handleOpenSettings = () => {
    setNav((prev) => ({
      ...prev,
      screen: "settings",
    }));
  };

  return (
    <div className="app">
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismissToast} />
      {nav.screen === "home" && (
        <HomeScreen onSurahSelect={handleSurahSelect} onSettings={handleOpenSettings} showError={toast.showError} />
      )}

      {nav.screen === "surahDetail" && nav.selectedSurah && (
        <SurahDetailScreen
          surah={nav.selectedSurah}
          onBack={handleBackToHome}
          onContinue={handleContinueToReciter}
        />
      )}

      {nav.screen === "reciter" && nav.selectedSurah && (
        <ReciterScreen
          surahNumber={nav.selectedSurah.number}
          ayahStart={nav.ayahRangeStart!}
          ayahEnd={nav.ayahRangeEnd!}
          onBack={handleBackToSurahDetail}
          onContinue={handleContinueToOutputSettings}
          onRecitersLoaded={handleRecitersLoaded}
        />
      )}

      {nav.screen === "outputSettings" && nav.selectedSurah && (
        <OutputSettingsScreen
          surahNumber={nav.selectedSurah.number}
          ayahStart={nav.ayahRangeStart!}
          ayahEnd={nav.ayahRangeEnd!}
          reciterId={nav.selectedReciterId!}
          onBack={handleBackToReciter}
          onContinue={handleContinueToVideoSource}
        />
      )}

      {nav.screen === "videoSource" && nav.selectedSurah && (
        <VideoSourceScreen
          surahNumber={nav.selectedSurah.number}
          ayahStart={nav.ayahRangeStart!}
          ayahEnd={nav.ayahRangeEnd!}
          reciterId={nav.selectedReciterId!}
          aspectRatio={nav.aspectRatio!}
          resolution={nav.resolution!}
          onBack={handleBackToOutputSettings}
          onContinue={handleContinueToSubtitleConfig}
          onStockVideo={handleStockVideo}
        />
      )}

      {nav.screen === "stockVideo" && nav.selectedSurah && (
        <StockVideoScreen
          surahNumber={nav.selectedSurah.number}
          ayahStart={nav.ayahRangeStart!}
          ayahEnd={nav.ayahRangeEnd!}
          reciterId={nav.selectedReciterId!}
          aspectRatio={nav.aspectRatio!}
          resolution={nav.resolution!}
          onBack={handleBackToVideoSource}
          onSelect={handleContinueToSubtitleConfig}
        />
      )}

      {nav.screen === "subtitleConfig" && nav.selectedSurah && (
        <SubtitleConfigScreen
          surahNumber={nav.selectedSurah.number}
          ayahStart={nav.ayahRangeStart!}
          ayahEnd={nav.ayahRangeEnd!}
          aspectRatio={nav.aspectRatio!}
          resolution={nav.resolution!}
          onBack={handleBackFromSubtitleConfig}
          onContinue={handleContinueToExport}
        />
      )}

      {nav.screen === "export" && nav.selectedSurah && (
        <ExportScreen
          surah={nav.selectedSurah}
          ayahStart={nav.ayahRangeStart!}
          ayahEnd={nav.ayahRangeEnd!}
          reciterId={nav.selectedReciterId!}
          reciters={nav.reciters}
          videoSource={nav.videoSource!}
          subtitleConfig={nav.subtitleConfig!}
          aspectRatio={nav.aspectRatio!}
          resolution={nav.resolution!}
          onBack={() => setNav((prev) => ({ ...prev, screen: "subtitleConfig" }))}
          onStartOver={handleBackToHome}
          showSuccess={toast.showSuccess}
        />
      )}

      {nav.screen === "settings" && (
        <SettingsScreen onBack={handleBackToHome} showError={toast.showError} showSuccess={toast.showSuccess} />
      )}
    </div>
  );
}

export default App;