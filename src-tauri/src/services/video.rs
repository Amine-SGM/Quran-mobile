use crate::services::ffmpeg::FFmpegService;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::AppHandle;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoFileInfo {
    pub path: String,
    pub width: u32,
    pub height: u32,
    pub duration: f64,
    pub format: String,
}

pub async fn get_video_metadata(
    app: &AppHandle,
    file_path: &PathBuf,
) -> Result<VideoFileInfo, String> {
    let path_str = file_path.to_string_lossy().to_string();

    let ffmpeg = FFmpegService::new();

    #[cfg(target_os = "android")]
    let probe = ffmpeg.probe_media(app, file_path).await?;

    #[cfg(target_os = "android")]
    let (width, height, duration) = (probe.width, probe.height, probe.duration);

    #[cfg(not(target_os = "android"))]
    let (width, height) = ffmpeg.get_video_dimensions(app, file_path).await?;

    #[cfg(not(target_os = "android"))]
    let duration = ffmpeg.get_duration(app, file_path).await?;

    let format = file_path
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.to_ascii_lowercase())
        .unwrap_or_else(|| "unknown".to_string());

    Ok(VideoFileInfo {
        path: path_str,
        width,
        height,
        duration,
        format,
    })
}
