import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Resolution } from "../types";
import { ApiKeySettings } from "../components/ApiKeySettings";
import { CacheManager } from "../components/CacheManager";
import { ToggleSwitch } from "../components/ToggleSwitch";
import "./SettingsScreen.css";

interface SettingsScreenProps {
  onBack: () => void;
  showError?: (message: string) => void;
  showSuccess?: (message: string) => void;
}

interface AppSettings {
  pexelsApiKeySet: boolean;
  exportResolution: string;
  autoCleanup: boolean;
  showVideoPreview: boolean;
}

interface CacheStats {
  totalFiles: number;
  totalSizeBytes: number;
  oldestFileAgeSeconds: number | null;
  formattedSize: string;
}

interface ClearCacheResponse {
  deletedFiles: number;
  freedBytes: number;
}

export function SettingsScreen({ onBack, showError, showSuccess }: SettingsScreenProps) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const data: AppSettings = await invoke("get_settings");
      setSettings(data);
    } catch (err) {
      showError?.("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  async function loadCacheStats() {
    try {
      const stats: CacheStats = await invoke("get_cache_stats");
      setCacheStats(stats);
    } catch {
      // Silently fail for cache stats
    }
  }

  async function updateSetting(updates: Partial<AppSettings>) {
    try {
      setSaving(true);
      await invoke("set_settings", {
        params: {
          export_resolution: updates.exportResolution,
          auto_cleanup: updates.autoCleanup,
          show_video_preview: updates.showVideoPreview,
        },
      });
      setSettings((prev) => (prev ? { ...prev, ...updates } : null));
      showSuccess?.("Settings saved");
    } catch {
      showError?.("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetApiKey(key: string) {
    await invoke("set_settings", { params: { pexels_api_key: key } });
    setSettings((prev) =>
      prev ? { ...prev, pexelsApiKeySet: true } : null
    );
  }

  async function handleClearApiKey() {
    await invoke("set_settings", { params: { pexels_api_key: "" } });
    setSettings((prev) =>
      prev ? { ...prev, pexelsApiKeySet: false } : null
    );
  }

  async function handleClearCache() {
    try {
      setClearingCache(true);
      const result: ClearCacheResponse = await invoke("clear_cache");
      showSuccess?.(`Cleared ${result.deletedFiles} cached files`);
      await loadCacheStats();
    } catch {
      showError?.("Failed to clear cache");
    } finally {
      setClearingCache(false);
    }
  }

  if (loading) {
    return (
      <div className="settings-screen">
        <header className="settings-header">
          <button className="back-button" onClick={onBack}>
            ← Back
          </button>
          <h1>Settings</h1>
        </header>
        <div className="loading-state">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="settings-screen">
      <header className="settings-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>Settings</h1>
      </header>

      <div className="settings-content">
        <section className="settings-section">
          <ApiKeySettings
            isSet={settings?.pexelsApiKeySet ?? false}
            onSetKey={handleSetApiKey}
            onClearKey={handleClearApiKey}
          />
        </section>

        <section className="settings-section">
          <h3>Export Defaults</h3>
          <div className="resolution-options">
            {(["720p", "1080p"] as Resolution[]).map((res) => (
              <button
                key={res}
                className={`resolution-option ${settings?.exportResolution === res ? "selected" : ""}`}
                onClick={() => updateSetting({ exportResolution: res })}
                disabled={saving}
              >
                {res}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <ToggleSwitch
            label="Auto-cleanup cache"
            checked={settings?.autoCleanup ?? true}
            onChange={(checked) => updateSetting({ autoCleanup: checked })}
            disabled={saving}
          />
          <ToggleSwitch
            label="Show video preview"
            checked={settings?.showVideoPreview ?? true}
            onChange={(checked) => updateSetting({ showVideoPreview: checked })}
            disabled={saving}
          />
        </section>

        <section className="settings-section">
          <CacheManager
            stats={cacheStats}
            loading={false}
            clearing={clearingCache}
            onClearCache={handleClearCache}
            onRefresh={loadCacheStats}
          />
        </section>

        <section className="settings-section about-section">
          <h3>About</h3>
          <div className="about-info">
            <p className="app-name">Quran Short Maker</p>
            <p className="app-version">Version 0.1.0</p>
            <p className="app-description">
              Create short videos with Quran recitations, background videos, and subtitles.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SettingsScreen;