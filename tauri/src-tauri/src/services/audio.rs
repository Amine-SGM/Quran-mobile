use crate::services::quran;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadAudioResponse {
    pub cache_path: String,
    pub duration_seconds: f64,
    pub word_timings: Option<Vec<(f64, f64)>>,
}

/// Download a single audio file for one ayah, fetching audio URLs internally.
pub async fn download_audio(
    reciter_id: u32,
    surah_number: u32,
    ayah_number: u32,
    cache_dir: PathBuf,
) -> Result<DownloadAudioResponse, String> {
    let audio_entries = quran::fetch_audio_urls(reciter_id, surah_number).await?;
    download_single_audio(reciter_id, surah_number, ayah_number, &cache_dir, &audio_entries).await
}

/// Download a single audio file for one ayah.
pub async fn download_single_audio(
    reciter_id: u32,
    surah_number: u32,
    ayah_number: u32,
    cache_dir: &PathBuf,
    audio_entries: &[quran::AudioFileEntry],
) -> Result<DownloadAudioResponse, String> {
    std::fs::create_dir_all(cache_dir)
        .map_err(|e| format!("Failed to create cache dir: {}", e))?;

    let file_name = format!("audio_{}_{}_{}.mp3", reciter_id, surah_number, ayah_number);
    let file_path = cache_dir.join(&file_name);

    let verse_key = format!("{}:{}", surah_number, ayah_number);
    let entry = audio_entries
        .iter()
        .find(|e| e.verse_key == verse_key)
        .ok_or_else(|| {
            format!(
                "Audio URL not found for verse {} (reciter {})",
                verse_key, reciter_id
            )
        })?;

    let audio_url = entry.url.clone();
    let word_timings = entry.segments.clone();

    // Return cached file if it already exists
    if file_path.exists() {
        let duration = get_audio_duration_internal(&file_path).await?;
        return Ok(DownloadAudioResponse {
            cache_path: file_path.to_string_lossy().to_string(),
            duration_seconds: duration,
            word_timings,
        });
    }

    // Download the audio file
    let client = reqwest::Client::new();
    let response = client
        .get(&audio_url)
        .send()
        .await
        .map_err(|e| format!("Network error downloading audio: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Failed to download audio: HTTP {} from {}",
            response.status(),
            audio_url
        ));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read audio response: {}", e))?;

    std::fs::write(&file_path, &bytes)
        .map_err(|e| format!("Failed to write audio file: {}", e))?;

    let duration = get_audio_duration_internal(&file_path).await?;

    Ok(DownloadAudioResponse {
        cache_path: file_path.to_string_lossy().to_string(),
        duration_seconds: duration,
        word_timings,
    })
}

/// Download all audio files for an ayah range.
pub async fn download_audio_range(
    reciter_id: u32,
    surah_number: u32,
    start_ayah: u32,
    end_ayah: u32,
    cache_dir: PathBuf,
) -> Result<Vec<DownloadAudioResponse>, String> {
    // Fetch all audio URLs for the chapter once
    let audio_entries = quran::fetch_audio_urls(reciter_id, surah_number).await?;
    
    let mut results = Vec::new();
    for ayah in start_ayah..=end_ayah {
        let resp = download_single_audio(reciter_id, surah_number, ayah, &cache_dir, &audio_entries).await?;
        results.push(resp);
    }
    
    Ok(results)
}

pub async fn get_audio_duration(file_path: String) -> Result<f64, String> {
    let path = PathBuf::from(file_path);
    get_audio_duration_internal(&path).await
}

/// Estimate audio duration from file size.
/// For precise duration, ffprobe should be used. This is a fallback.
async fn get_audio_duration_internal(file_path: &PathBuf) -> Result<f64, String> {
    let ffmpeg = crate::services::ffmpeg::FFmpegService::new();
    ffmpeg.get_duration(file_path)
}
