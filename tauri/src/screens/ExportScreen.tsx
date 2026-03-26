import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { Surah, Reciter, VideoSource, SubtitleConfig, AspectRatio, Resolution } from "../types";
import { ProgressRing } from "../components/ProgressRing";
import { ShareButton } from "../components/ShareButton";
import "./ExportScreen.css";

interface ExportScreenProps {
  surah: Surah;
  ayahStart: number;
  ayahEnd: number;
  reciterId: number;
  reciters: Reciter[];
  videoSource: VideoSource;
  subtitleConfig: SubtitleConfig;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  onBack: () => void;
  onStartOver: () => void;
  showSuccess?: (message: string) => void;
}

interface RenderProgress {
  job_id: string;
  progress: number;
  message: string;
}

interface RenderComplete {
  job_id: string;
  output_path: string;
}

interface RenderError {
  job_id: string;
  error: string;
}

interface StartRenderResponse {
  job_id: string;
}

export function ExportScreen({
  surah,
  ayahStart,
  ayahEnd,
  reciterId,
  reciters,
  videoSource,
  subtitleConfig,
  aspectRatio,
  resolution,
  onBack,
  onStartOver,
  showSuccess,
}: ExportScreenProps) {
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [outputPath, setOutputPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reciter = reciters.find((r) => r.id === reciterId);

  useEffect(() => {
    const unlisteners: Array<() => void> = [];

    const setupListeners = async () => {
      unlisteners.push(
        await listen<RenderProgress>("render_progress", (event) => {
          setProgress(event.payload.progress);
          setStatusMessage(event.payload.message);
        })
      );

      unlisteners.push(
        await listen<RenderComplete>("render_complete", (event) => {
          setProgress(100);
          setStatusMessage("Complete!");
          setOutputPath(event.payload.output_path);
          setRendering(false);
          showSuccess?.("Video exported successfully!");
        })
      );

      unlisteners.push(
        await listen<RenderError>("render_error", (event) => {
          setError(event.payload.error);
          setRendering(false);
        })
      );
    };

    setupListeners();

    return () => {
      unlisteners.forEach((unlisten) => unlisten());
    };
  }, []);

  const handleStartRender = async () => {
    try {
      setRendering(true);
      setProgress(0);
      setError(null);
      setOutputPath(null);
      setStatusMessage("Starting render...");

      await invoke<StartRenderResponse>("start_render", {
        params: {
          surah_number: surah.number,
          ayah_range_start: ayahStart,
          ayah_range_end: ayahEnd,
          reciter_id: reciterId,
          video_source: {
            type: videoSource.type,
            local_path: videoSource.localPath,
            stock_video_id: videoSource.stockVideoId,
            stock_video_url: videoSource.stockVideoUrl,
            width: videoSource.width,
            height: videoSource.height,
            duration: videoSource.duration,
          },
          subtitle_config: {
            enabled: subtitleConfig.enabled,
            font_size: subtitleConfig.fontSize,
            color: subtitleConfig.color,
            position: subtitleConfig.position,
            show_translation: subtitleConfig.showTranslation,
            translation_font_size: subtitleConfig.translationFontSize,
          },
          aspect_ratio: aspectRatio,
          resolution: resolution,
        },
      });
    } catch (err) {
      setError(err as string);
      setRendering(false);
    }
  };

  const handleCancel = async () => {
    try {
      await invoke("cancel_job", { jobId: "current" });
      setRendering(false);
      setStatusMessage("Cancelled");
    } catch (err) {
      console.error("Cancel failed:", err);
    }
  };

  return (
    <div className="export-screen">
      <header className="export-header">
        <button className="back-button" onClick={onBack} disabled={rendering}>
          ← Back
        </button>
        <h1>Export Video</h1>
      </header>

      <div className="export-content">
        <section className="summary-section">
          <h3>Summary</h3>
          
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Surah</span>
              <span className="summary-value">{surah.englishName} ({surah.number})</span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Ayahs</span>
              <span className="summary-value">{ayahStart} - {ayahEnd}</span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Reciter</span>
              <span className="summary-value">{reciter?.name || `ID: ${reciterId}`}</span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Video Source</span>
              <span className="summary-value">
                {videoSource.type === "upload" ? "Uploaded" : "Stock"} ({videoSource.width}x{videoSource.height})
              </span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Subtitles</span>
              <span className="summary-value">
                {subtitleConfig.enabled 
                  ? `${subtitleConfig.color}, ${subtitleConfig.position}${subtitleConfig.showTranslation ? " + translation" : ""}`
                  : "Disabled"}
              </span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Output</span>
              <span className="summary-value">{aspectRatio} @ {resolution}</span>
            </div>
          </div>
        </section>

        {rendering && (
          <section className="progress-section">
            <ProgressRing progress={progress} />
            <p className="status-message">{statusMessage}</p>
            <button className="cancel-button" onClick={handleCancel}>
              Cancel
            </button>
          </section>
        )}

        {error && (
          <section className="error-section">
            <p className="error-message">{error}</p>
            <button className="retry-button" onClick={handleStartRender}>
              Try Again
            </button>
          </section>
        )}

        {outputPath && (
          <section className="complete-section">
            <div className="complete-icon">✓</div>
            <h3>Video Ready!</h3>
            <p className="output-path">{outputPath}</p>
            <ShareButton videoPath={outputPath} />
          </section>
        )}

        {!rendering && !outputPath && !error && (
          <section className="action-section">
            <button className="render-button" onClick={handleStartRender}>
              Start Rendering
            </button>
            <button className="start-over-button" onClick={onStartOver}>
              Start Over
            </button>
          </section>
        )}
      </div>
    </div>
  );
}

export default ExportScreen;