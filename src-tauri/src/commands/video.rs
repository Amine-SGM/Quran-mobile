#[cfg(target_os = "android")]
use crate::services::cache;
use crate::services::pexels;
use crate::services::storage;
use crate::services::video as video_service;
use serde::{Deserialize, Serialize};
#[cfg(target_os = "android")]
use std::io;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::{DialogExt, FilePath};
#[cfg(target_os = "android")]
use tauri_plugin_fs::{FsExt, OpenOptions};
use tokio::sync::oneshot;
#[cfg(target_os = "android")]
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoFileInfo {
    pub path: String,
    pub width: u32,
    pub height: u32,
    pub duration: f64,
    pub format: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PexelsVideoPicture {
    pub id: u32,
    pub picture: String,
    pub nr: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PexelsVideoFile {
    pub id: u32,
    pub quality: String,
    pub file_type: String,
    pub width: u32,
    pub height: u32,
    pub link: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PexelsVideo {
    pub id: u32,
    pub user_name: String,
    pub duration: f64,
    pub width: u32,
    pub height: u32,
    pub video_pictures: Vec<PexelsVideoPicture>,
    pub video_files: Vec<PexelsVideoFile>,
}

impl From<pexels::PexelsVideo> for PexelsVideo {
    fn from(v: pexels::PexelsVideo) -> Self {
        PexelsVideo {
            id: v.id,
            user_name: v.user_name,
            duration: v.duration,
            width: v.width,
            height: v.height,
            video_pictures: v
                .video_pictures
                .into_iter()
                .map(|p| PexelsVideoPicture {
                    id: p.id,
                    picture: p.picture,
                    nr: p.nr,
                })
                .collect(),
            video_files: v
                .video_files
                .into_iter()
                .map(|f| PexelsVideoFile {
                    id: f.id,
                    quality: f.quality,
                    file_type: f.file_type,
                    width: f.width,
                    height: f.height,
                    link: f.link,
                })
                .collect(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchPexelsResponse {
    pub videos: Vec<PexelsVideo>,
    pub total_results: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockVideoResponse {
    pub cache_path: String,
    pub width: u32,
    pub height: u32,
    pub duration: f64,
}

#[tauri::command]
pub async fn select_video_file(app: AppHandle) -> Result<VideoFileInfo, String> {
    let file_path = pick_video_file(&app).await?;

    match file_path {
        Some(path) => {
            let path_buf = prepare_selected_video_path(&app, path)?;
            let info = video_service::get_video_metadata(&app, &path_buf).await?;
            Ok(VideoFileInfo {
                path: info.path,
                width: info.width,
                height: info.height,
                duration: info.duration,
                format: info.format,
            })
        }
        None => Err("CANCELLED".to_string()),
    }
}

async fn pick_video_file(app: &AppHandle) -> Result<Option<FilePath>, String> {
    let (tx, rx) = oneshot::channel();

    app.dialog()
        .file()
        .add_filter("Video Files", &["mp4", "mov", "avi", "mkv", "webm"])
        .pick_file(move |file_path| {
            let _ = tx.send(file_path);
        });

    rx.await
        .map_err(|_| "Failed to receive selected file from picker".to_string())
}

#[cfg(not(target_os = "android"))]
fn prepare_selected_video_path(_app: &AppHandle, file_path: FilePath) -> Result<PathBuf, String> {
    file_path
        .into_path()
        .map_err(|e| format!("Failed to resolve selected file path: {}", e))
}

#[cfg(target_os = "android")]
fn prepare_selected_video_path(app: &AppHandle, file_path: FilePath) -> Result<PathBuf, String> {
    let cache_dir = cache::get_cache_dir(app)?;
    let uploads_dir = cache_dir.join("selected-videos");
    std::fs::create_dir_all(&uploads_dir)
        .map_err(|e| format!("Failed to create selected video cache dir: {}", e))?;

    let extension = selected_video_extension(&file_path);
    let staged_path = uploads_dir.join(format!("selected_{}.{}", Uuid::new_v4(), extension));

    let mut source = app
        .fs()
        .open(file_path, OpenOptions::new())
        .map_err(|e| format!("Failed to open selected video: {}", e))?;
    let mut destination = std::fs::File::create(&staged_path)
        .map_err(|e| format!("Failed to create staged video file: {}", e))?;

    io::copy(&mut source, &mut destination)
        .map_err(|e| format!("Failed to copy selected video into app cache: {}", e))?;

    Ok(staged_path)
}

#[cfg(target_os = "android")]
fn selected_video_extension(file_path: &FilePath) -> String {
    let extension = match file_path {
        FilePath::Path(path) => path.extension().and_then(|ext| ext.to_str()),
        FilePath::Url(url) => url
            .path_segments()
            .and_then(|segments| segments.last())
            .and_then(|name| name.rsplit_once('.').map(|(_, ext)| ext)),
    };

    extension
        .filter(|ext| !ext.is_empty())
        .unwrap_or("mp4")
        .to_ascii_lowercase()
}

#[tauri::command]
pub async fn search_pexels_videos(
    app: AppHandle,
    query: String,
    aspect_ratio: String,
    resolution: String,
    per_page: Option<u32>,
) -> Result<SearchPexelsResponse, String> {
    let api_key = storage::get_pexels_api_key(&app)
        .await?
        .ok_or_else(|| "API_KEY_NOT_SET".to_string())?;

    let orientation = pexels::get_orientation(&aspect_ratio);
    let per_page = per_page.unwrap_or(20);

    // Randomize page (1-4) using timestamp for variety
    let page = (std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0)
        % 4) as u32
        + 1;

    // Map resolution to pixel filters
    let mut min_width = None;
    let mut min_height = None;

    let target_pixels = match resolution.as_str() {
        "1080p" => 1920,
        _ => 1280, // Default 720p
    };

    match aspect_ratio.as_str() {
        "16:9" => min_width = Some(target_pixels),
        "9:16" | "4:5" => min_height = Some(target_pixels),
        "1:1" => {
            let square_pixels = if target_pixels == 1920 { 1080 } else { 720 };
            min_width = Some(square_pixels);
            min_height = Some(square_pixels);
        }
        _ => {}
    }

    let response = pexels::search_videos(
        &api_key,
        &query,
        orientation,
        min_width,
        min_height,
        page,
        per_page,
    )
    .await?;

    Ok(SearchPexelsResponse {
        videos: response.videos.into_iter().map(|v| v.into()).collect(),
        total_results: response.total_results,
    })
}

#[tauri::command]
pub async fn download_stock_video(
    app: AppHandle,
    video_id: u32,
    video_url: String,
) -> Result<StockVideoResponse, String> {
    let cache_dir = app
        .path()
        .app_cache_dir()
        .map_err(|e| format!("Failed to get cache dir: {}", e))?;

    let filename = format!("pexels_{}.mp4", video_id);

    let file_path = storage::download_video(&video_url, cache_dir, &filename).await?;

    let metadata = video_service::get_video_metadata(&app, &file_path).await?;

    Ok(StockVideoResponse {
        cache_path: file_path.to_string_lossy().to_string(),
        width: metadata.width,
        height: metadata.height,
        duration: metadata.duration,
    })
}
