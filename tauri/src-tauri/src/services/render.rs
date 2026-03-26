use crate::services::ffmpeg::{FFmpegService, RenderConfig};
use crate::services::subtitle::{SubtitleService, SubtitleRenderConfig};
use crate::services::quran;
use crate::services::audio;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};
use uuid::Uuid;

#[derive(Debug, Clone, PartialEq)]
pub enum JobStatus {
    Queued,
    Processing,
    Completed,
    Failed,
}

impl std::fmt::Display for JobStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            JobStatus::Queued => write!(f, "queued"),
            JobStatus::Processing => write!(f, "processing"),
            JobStatus::Completed => write!(f, "completed"),
            JobStatus::Failed => write!(f, "failed"),
        }
    }
}

#[derive(Debug, Clone)]
pub struct RenderJob {
    pub id: String,
    pub status: JobStatus,
    pub progress: u32,
    pub output_path: Option<PathBuf>,
    pub error_message: Option<String>,
    pub config: RenderConfig,
}

lazy_static::lazy_static! {
    static ref JOBS: Mutex<HashMap<String, RenderJob>> = Mutex::new(HashMap::new());
}

#[allow(dead_code)]
pub fn create_job(config: RenderConfig) -> String {
    let job_id = Uuid::new_v4().to_string();
    create_job_with_id(job_id.clone(), config);
    job_id
}

/// Create a job with a pre-determined ID (so the output path can match).
pub fn create_job_with_id(job_id: String, config: RenderConfig) -> String {
    let job = RenderJob {
        id: job_id.clone(),
        status: JobStatus::Queued,
        progress: 0,
        output_path: None,
        error_message: None,
        config,
    };

    let mut jobs = JOBS.lock().unwrap();
    jobs.insert(job_id.clone(), job);

    job_id
}

pub fn get_job(job_id: &str) -> Option<RenderJob> {
    let jobs = JOBS.lock().unwrap();
    jobs.get(job_id).cloned()
}

pub fn update_job_progress(job_id: &str, progress: u32) {
    let mut jobs = JOBS.lock().unwrap();
    if let Some(job) = jobs.get_mut(job_id) {
        job.progress = progress;
        job.status = JobStatus::Processing;
    }
}

pub fn complete_job(job_id: &str, output_path: PathBuf) {
    let mut jobs = JOBS.lock().unwrap();
    if let Some(job) = jobs.get_mut(job_id) {
        job.status = JobStatus::Completed;
        job.progress = 100;
        job.output_path = Some(output_path);
    }
}

pub fn fail_job(job_id: &str, error: String) {
    let mut jobs = JOBS.lock().unwrap();
    if let Some(job) = jobs.get_mut(job_id) {
        job.status = JobStatus::Failed;
        job.error_message = Some(error);
    }
}

pub fn cancel_job(job_id: &str) -> bool {
    let mut jobs = JOBS.lock().unwrap();
    if let Some(job) = jobs.get_mut(job_id) {
        if job.status == JobStatus::Queued || job.status == JobStatus::Processing {
            job.status = JobStatus::Failed;
            job.error_message = Some("Cancelled by user".to_string());
            return true;
        }
    }
    false
}

pub async fn start_render(
    app: AppHandle,
    job_id: String,
    arabic_texts: Vec<String>,
    translations: Vec<Option<String>>,
) -> Result<String, String> {
    let job = get_job(&job_id).ok_or("Job not found")?;
    let mut config = job.config.clone();

    let ffmpeg = FFmpegService::new();

    update_job_progress(&job_id, 5);
    emit_progress(&app, &job_id, 5, "Preparing...");

    let output_path = config.output_path.clone();

    if let Some(parent) = output_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create output dir: {}", e))?;
    }

    // ── Step 1: Fetch ayah texts and surah name if not provided ─────
    if config.surah_name.is_empty() {
        if let Ok(name) = quran::fetch_surah_name(config.surah_number).await {
            config.surah_name = name;
        }
    }

    let (final_arabic, final_translations) = if arabic_texts.is_empty() {
        update_job_progress(&job_id, 8);
        emit_progress(&app, &job_id, 8, "Fetching verse texts...");

        match quran::fetch_ayahs(config.surah_number, Some("en".to_string())).await {
            Ok(ayahs) => {
                let filtered: Vec<_> = ayahs.into_iter()
                    .filter(|a| a.number >= config.ayah_range_start && a.number <= config.ayah_range_end)
                    .collect();
                
                let arabic: Vec<String> = filtered.iter().map(|a| a.arabic_text.clone()).collect();
                let trans: Vec<Option<String>> = filtered.iter().map(|a| a.english_translation.clone()).collect();
                (arabic, trans)
            }
            Err(e) => return Err(format!("Failed to fetch ayahs: {}", e)),
        }
    } else {
        (arabic_texts, translations)
    };

    // ── Step 2: Download audio range ───────────────────────────
    update_job_progress(&job_id, 10);
    emit_progress(&app, &job_id, 10, "Downloading audio...");

    let cache_dir = app.path().app_cache_dir()
        .map_err(|e| format!("Failed to get cache dir: {}", e))?;

    let audio_results = match audio::download_audio_range(
        config.reciter_id,
        config.surah_number,
        config.ayah_range_start,
        config.ayah_range_end,
        cache_dir
    ).await {
        Ok(results) => results,
        Err(e) => {
            fail_job(&job_id, format!("Audio download failed: {}", e));
            emit_error(&app, &job_id, format!("Audio download failed: {}", e));
            return Err(format!("Audio download failed: {}", e));
        }
    };

    config.audio_paths = audio_results.iter().map(|r| PathBuf::from(&r.cache_path)).collect();

    // ── Step 3: Generate subtitles if enabled ─────────────────
    if config.subtitle_enabled && !final_arabic.is_empty() {
        update_job_progress(&job_id, 15);
        emit_progress(&app, &job_id, 15, "Generating subtitles...");

        let subtitle_service = SubtitleService::new();
        let durations: Vec<f64> = audio_results.iter().map(|r| r.duration_seconds).collect();

        let mut lines = Vec::new();
        let mut current_time = 0.0;

        for (i, text) in final_arabic.iter().enumerate() {
            let duration = durations.get(i).copied().unwrap_or(3.0);
            lines.push(crate::services::subtitle::SubtitleLine {
                arabic_text: text.clone(),
                english_translation: final_translations.get(i).and_then(|t| t.clone()),
                start_time: current_time,
                end_time: current_time + duration,
            });
            current_time += duration;
        }

        let subtitle_config = SubtitleRenderConfig {
            font_size: config.subtitle_font_size,
            color: config.subtitle_color.clone(),
            position: config.subtitle_position.clone(),
            show_translation: config.show_translation,
            translation_font_size: config.subtitle_font_size * 60 / 100,
            surah_name: config.surah_name.clone(),
            width: config.width,
            height: config.height,
        };

        let ass_dir = output_path.parent().unwrap_or(std::path::Path::new("."));
        let ass_path = ass_dir.join(format!("subtitles_{}.ass", job_id));
        subtitle_service.generate_ass_file(&lines, &subtitle_config, &ass_path)?;

        config.subtitle_path = Some(ass_path);
    }

    update_job_progress(&job_id, 20);
    emit_progress(&app, &job_id, 20, "Rendering video...");

    let args = ffmpeg.build_merge_command(&config);

    match ffmpeg.execute(args) {
        Ok(()) => {
            complete_job(&job_id, output_path.clone());
            emit_complete(&app, &job_id, output_path.to_string_lossy().to_string());
            Ok(output_path.to_string_lossy().to_string())
        }
        Err(e) => {
            fail_job(&job_id, e.clone());
            emit_error(&app, &job_id, e.clone());
            Err(e)
        }
    }
}

fn emit_progress(app: &AppHandle, job_id: &str, progress: u32, message: &str) {
    let _ = app.emit("render_progress", serde_json::json!({
        "job_id": job_id,
        "progress": progress,
        "message": message,
    }));
}

fn emit_complete(app: &AppHandle, job_id: &str, output_path: String) {
    let _ = app.emit("render_complete", serde_json::json!({
        "job_id": job_id,
        "output_path": output_path,
    }));
}

fn emit_error(app: &AppHandle, job_id: &str, error: String) {
    let _ = app.emit("render_error", serde_json::json!({
        "job_id": job_id,
        "error": error,
    }));
}