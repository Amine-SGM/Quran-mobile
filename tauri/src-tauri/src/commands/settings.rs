use crate::services::{cache, storage};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub pexels_api_key_set: bool,
    pub export_resolution: String,
    pub auto_cleanup: bool,
    pub show_video_preview: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SetSettingsParams {
    pub pexels_api_key: Option<String>,
    pub export_resolution: Option<String>,
    pub auto_cleanup: Option<bool>,
    pub show_video_preview: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClearCacheResponse {
    pub deleted_files: u32,
    pub freed_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheStatsResponse {
    pub total_files: u32,
    pub total_size_bytes: u64,
    pub oldest_file_age_seconds: Option<u64>,
    pub formatted_size: String,
}

#[tauri::command]
pub async fn get_settings(app: AppHandle) -> Result<AppSettings, String> {
    let pexels_api_key_set = storage::has_pexels_api_key(&app).await?;

    let export_resolution = storage::get_setting(&app, "export_resolution")
        .await?
        .unwrap_or_else(|| "1080p".to_string());

    let auto_cleanup = storage::get_setting(&app, "auto_cleanup")
        .await?
        .map(|v| v == "true")
        .unwrap_or(true);

    let show_video_preview = storage::get_setting(&app, "show_video_preview")
        .await?
        .map(|v| v == "true")
        .unwrap_or(true);

    Ok(AppSettings {
        pexels_api_key_set,
        export_resolution,
        auto_cleanup,
        show_video_preview,
    })
}

#[tauri::command]
pub async fn set_settings(app: AppHandle, params: SetSettingsParams) -> Result<(), String> {
    if let Some(key) = params.pexels_api_key {
        if !key.is_empty() {
            storage::set_pexels_api_key(&app, &key).await?;
        }
    }

    if let Some(resolution) = params.export_resolution {
        storage::set_setting(&app, "export_resolution", &resolution).await?;
    }

    if let Some(auto_cleanup) = params.auto_cleanup {
        storage::set_setting(&app, "auto_cleanup", if auto_cleanup { "true" } else { "false" }).await?;
    }

    if let Some(show_preview) = params.show_video_preview {
        storage::set_setting(&app, "show_video_preview", if show_preview { "true" } else { "false" }).await?;
    }

    Ok(())
}

#[tauri::command]
pub async fn get_cache_stats(app: AppHandle) -> Result<CacheStatsResponse, String> {
    let stats = cache::get_cache_stats(&app)?;
    
    Ok(CacheStatsResponse {
        total_files: stats.total_files,
        total_size_bytes: stats.total_size_bytes,
        oldest_file_age_seconds: stats.oldest_file_age_seconds,
        formatted_size: format_size(stats.total_size_bytes),
    })
}

#[tauri::command]
pub async fn clear_cache(app: AppHandle) -> Result<ClearCacheResponse, String> {
    let (deleted_files, freed_bytes) = cache::clean_all_cache(&app)?;

    Ok(ClearCacheResponse {
        deleted_files,
        freed_bytes,
    })
}

#[tauri::command]
pub async fn clean_expired_cache(app: AppHandle) -> Result<ClearCacheResponse, String> {
    let (deleted_files, freed_bytes) = cache::clean_expired_cache(&app)?;

    Ok(ClearCacheResponse {
        deleted_files,
        freed_bytes,
    })
}

fn format_size(bytes: u64) -> String {
    if bytes < 1024 {
        format!("{} B", bytes)
    } else if bytes < 1024 * 1024 {
        format!("{:.1} KB", bytes as f64 / 1024.0)
    } else if bytes < 1024 * 1024 * 1024 {
        format!("{:.1} MB", bytes as f64 / (1024.0 * 1024.0))
    } else {
        format!("{:.1} GB", bytes as f64 / (1024.0 * 1024.0 * 1024.0))
    }
}