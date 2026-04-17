use crate::services::ffmpeg::RenderConfig;
use crate::services::render;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoSource {
    #[serde(rename = "type")]
    pub source_type: String,
    pub local_path: Option<String>,
    pub stock_video_id: Option<u32>,
    pub stock_video_url: Option<String>,
    pub width: u32,
    pub height: u32,
    pub duration: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleConfigInput {
    pub enabled: bool,
    pub font_size: u32,
    pub arabic_color: String,
    pub translation_color: String,
    pub position: String,
    pub show_translation: bool,
    pub translation_font_size: u32,
    pub custom_text: String,
    pub highlight_color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StartRenderParams {
    pub surah_number: u32,
    pub ayah_range_start: u32,
    pub ayah_range_end: u32,
    pub reciter_id: u32,
    pub video_source: VideoSource,
    pub subtitle_config: SubtitleConfigInput,
    pub aspect_ratio: String,
    pub resolution: String,
    pub arabic_texts: Option<Vec<String>>,
    pub translations: Option<Vec<Option<String>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StartRenderResponse {
    pub job_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobStatusResponse {
    pub id: String,
    pub status: String,
    pub progress: u32,
    pub output_path: Option<String>,
    pub error_message: Option<String>,
}

#[tauri::command]
pub async fn start_render(
    app: AppHandle,
    params: StartRenderParams,
) -> Result<StartRenderResponse, String> {
    let cache_dir = app
        .path()
        .app_cache_dir()
        .map_err(|e| format!("Failed to get cache dir: {}", e))?;

    let output_dir = app
        .path()
        .app_cache_dir()
        .map_err(|e| format!("Failed to get cache dir: {}", e))?;

    std::fs::create_dir_all(&output_dir)
        .map_err(|e| format!("Failed to create output dir: {}", e))?;

    // Resolve video path
    let video_path = if params.video_source.source_type == "upload" {
        PathBuf::from(params.video_source.local_path.unwrap_or_default())
    } else {
        cache_dir.join(format!(
            "pexels_{}.mp4",
            params.video_source.stock_video_id.unwrap_or(0)
        ))
    };

    let (width, height) = get_target_dimensions(&params.aspect_ratio, &params.resolution);

    // Build a proper output path before creating the job
    let job_id_preview = uuid::Uuid::new_v4().to_string();
    let output_path = output_dir.join(format!("output_{}.mp4", job_id_preview));

    // Resolve audio: download all ayahs for this reciter/surah range
    // Audio files will be concatenated during the render phase
    let audio_path = cache_dir.join(format!(
        "audio_{}_{}_{}.mp3",
        params.reciter_id, params.surah_number, params.ayah_range_start
    ));

    // Resolve calligraphy PNG path
    // In production: bundled as resources/surahs/{:03}.png
    // In dev: located at public/surahs/{:03}.png relative to the crate root
    let surah_image_filename = format!("{:03}.png", params.surah_number);
    let surah_image_path = {
        // Try the bundled resource path first (production)
        let resource_path = app
            .path()
            .resource_dir()
            .ok()
            .map(|d| d.join("surahs").join(&surah_image_filename));

        // Fall back to the project's public/ directory (dev mode)
        let dev_path = std::env::var("CARGO_MANIFEST_DIR")
            .ok()
            .map(|d| PathBuf::from(d).parent().unwrap_or(std::path::Path::new(".")).to_path_buf().join("public").join("surahs").join(&surah_image_filename));

        match (resource_path, dev_path) {
            (Some(p), _) if p.exists() => Some(p),
            (_, Some(p)) if p.exists() => Some(p),
            _ => None,
        }
    };

    let config = RenderConfig {
        surah_number: params.surah_number,
        ayah_range_start: params.ayah_range_start,
        ayah_range_end: params.ayah_range_end,
        reciter_id: params.reciter_id,
        surah_name: String::new(), // Will be populated in render service
        audio_paths: vec![audio_path],
        video_path,
        output_path,
        subtitle_path: None,
        surah_image_path,
        width,
        height,
        aspect_ratio: params.aspect_ratio,
        subtitle_enabled: params.subtitle_config.enabled,
        subtitle_font_size: params.subtitle_config.font_size,
        arabic_color: params.subtitle_config.arabic_color,
        translation_color: params.subtitle_config.translation_color,
        subtitle_position: params.subtitle_config.position,
        show_translation: params.subtitle_config.show_translation,
        custom_text: params.subtitle_config.custom_text,
        highlight_color: params.subtitle_config.highlight_color,
        input_width: None,
        input_height: None,
        #[cfg(target_os = "android")]
        fonts_dir: Some("/system/fonts".to_string()),
        #[cfg(not(target_os = "android"))]
        fonts_dir: None,
        total_duration: 0.0,
    };

    let arabic_texts = params.arabic_texts.unwrap_or_default();
    let translations = params.translations.unwrap_or_default();
    let job_id = render::create_job_with_id(job_id_preview, config.clone());

    let app_clone = app.clone();
    let job_id_clone = job_id.clone();
    tokio::spawn(async move {
        let _ = render::start_render(app_clone, job_id_clone, arabic_texts, translations).await;
    });

    Ok(StartRenderResponse { job_id })
}

#[tauri::command]
pub async fn get_job_status(job_id: String) -> Result<JobStatusResponse, String> {
    let job = render::get_job(&job_id).ok_or("Job not found")?;

    Ok(JobStatusResponse {
        id: job.id,
        status: job.status.to_string(),
        progress: job.progress,
        output_path: job.output_path.map(|p| p.to_string_lossy().to_string()),
        error_message: job.error_message,
    })
}

#[tauri::command]
pub async fn cancel_job(job_id: String) -> Result<bool, String> {
    Ok(render::cancel_job(&job_id))
}

fn get_target_dimensions(aspect_ratio: &str, resolution: &str) -> (u32, u32) {
    let base_height: u32 = match resolution {
        "720p" => 720,
        "1080p" => 1080,
        _ => 1080,
    };

    match aspect_ratio {
        "9:16" => (base_height * 9 / 16, base_height),
        "1:1" => (base_height, base_height),
        "4:5" => (base_height * 4 / 5, base_height),
        "16:9" => (base_height * 16 / 9, base_height),
        _ => (base_height * 9 / 16, base_height),
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveToGalleryResponse {
    pub gallery_path: String,
}

#[tauri::command]
pub async fn save_to_gallery(app: AppHandle, path: String) -> Result<SaveToGalleryResponse, String> {
    #[cfg(target_os = "android")]
    {
        let ffmpeg = app.state::<tauri_plugin_ffmpeg::Ffmpeg<tauri::Wry>>();
        let resp = ffmpeg
            .save_to_gallery(path)
            .map_err(|e| format!("Save to gallery failed: {}", e))?;
        Ok(SaveToGalleryResponse {
            gallery_path: resp.gallery_path,
        })
    }

    #[cfg(not(target_os = "android"))]
    {
        let _ = (app, path);
        Err("Save to gallery is only supported on Android".to_string())
    }
}

#[tauri::command]
pub async fn share_video(app: AppHandle, path: String) -> Result<bool, String> {
    #[cfg(target_os = "android")]
    {
        let ffmpeg = app.state::<tauri_plugin_ffmpeg::Ffmpeg<tauri::Wry>>();
        let resp = ffmpeg
            .share_video(path)
            .map_err(|e| format!("Share video failed: {}", e))?;
        Ok(resp.shared)
    }

    #[cfg(not(target_os = "android"))]
    {
        let _ = (app, path);
        Err("Share video is only supported on Android".to_string())
    }
}