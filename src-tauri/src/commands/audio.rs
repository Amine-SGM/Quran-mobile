use crate::services::audio as audio_service;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StageAudioResponse {
    pub staged_dir: String,
    pub staged_files: Vec<String>,
}

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

    let response = audio_service::download_audio(&app, reciter_id, surah_number, ayah_number, cache_dir)
        .await?;

    Ok(DownloadAudioResponse {
        cache_path: response.cache_path,
        duration_seconds: response.duration_seconds,
    })
}

#[tauri::command]
pub async fn stage_reciter_audio(
    app: AppHandle,
    reciter_id: u32,
    surah_number: u32,
    ayah_start: u32,
    ayah_end: u32,
) -> Result<StageAudioResponse, String> {
    let cache_dir = app
        .path()
        .app_cache_dir()
        .map_err(|e| format!("Failed to get cache dir: {}", e))?;

    let response = audio_service::stage_reciter_audio_range(
        &app,
        reciter_id,
        surah_number,
        ayah_start,
        ayah_end,
        cache_dir.clone(),
    )
    .await?;

    Ok(StageAudioResponse {
        staged_dir: audio_service::staged_audio_dir(&cache_dir)
            .to_string_lossy()
            .to_string(),
        staged_files: response.into_iter().map(|item| item.cache_path).collect(),
    })
}

#[tauri::command]
pub async fn clear_staged_reciter_audio(app: AppHandle) -> Result<bool, String> {
    let cache_dir = app
        .path()
        .app_cache_dir()
        .map_err(|e| format!("Failed to get cache dir: {}", e))?;

    audio_service::clear_staged_audio(&cache_dir)?;
    Ok(true)
}

#[tauri::command]
pub async fn get_audio_duration(app: AppHandle, file_path: String) -> Result<f64, String> {
    audio_service::get_audio_duration(&app, file_path).await
}
