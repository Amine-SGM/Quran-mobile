use crate::services::audio as audio_service;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadAudioResponse {
    pub cache_path: String,
    pub duration_seconds: f64,
}

#[tauri::command]
pub async fn download_audio(
    app: AppHandle,
    reciter_id: u32,
    surah_number: u32,
    ayah_number: u32,
) -> Result<DownloadAudioResponse, String> {
    let cache_dir = app
        .path()
        .app_cache_dir()
        .map_err(|e| format!("Failed to get cache dir: {}", e))?;

    let response =
        audio_service::download_audio(&app, reciter_id, surah_number, ayah_number, cache_dir)
            .await?;

    Ok(DownloadAudioResponse {
        cache_path: response.cache_path,
        duration_seconds: response.duration_seconds,
    })
}

#[tauri::command]
pub async fn get_audio_duration(app: AppHandle, file_path: String) -> Result<f64, String> {
    audio_service::get_audio_duration(&app, file_path).await
}
