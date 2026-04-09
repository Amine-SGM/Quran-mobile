use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderConfig {
    pub surah_number: u32,
    pub ayah_range_start: u32,
    pub ayah_range_end: u32,
    pub reciter_id: u32,
    pub surah_name: String,
    pub audio_paths: Vec<PathBuf>,
    pub video_path: PathBuf,
    pub output_path: PathBuf,
    pub subtitle_path: Option<PathBuf>,
    pub surah_image_path: Option<PathBuf>,
    pub width: u32,
    pub height: u32,
    pub aspect_ratio: String,
    pub subtitle_enabled: bool,
    pub subtitle_font_size: u32,
    pub arabic_color: String,
    pub translation_color: String,
    pub subtitle_position: String,
    pub show_translation: bool,
    pub custom_text: String,
    pub highlight_color: String,
    pub input_width: Option<u32>,
    pub input_height: Option<u32>,
}

pub struct FFmpegService;

impl FFmpegService {
    pub fn new() -> Self {
        Self
    }

    pub async fn get_video_dimensions(&self, app: &AppHandle, path: &PathBuf) -> Result<(u32, u32), String> {
        let sidecar = app.shell().sidecar("ffprobe")
            .map_err(|e| format!("Failed to create ffprobe sidecar: {}", e))?;
            
        let output = sidecar

            .args([
                "-v",
                "error",
                "-select_streams",
                "v:0",
                "-show_entries",
                "stream=width,height",
                "-of",
                "csv=s=x:p=0",
                &path.to_string_lossy(),
            ])
            .output()
            .await
            .map_err(|e| format!("Failed to execute ffprobe: {}", e))?;

        if !output.status.success() {
            return Err(format!(
                "ffprobe failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        let result = String::from_utf8_lossy(&output.stdout);
        let dims: Vec<&str> = result.trim().split('x').collect();

        if dims.len() != 2 {
            return Err(format!("Invalid dimensions format: {}", result));
        }

        let width = dims[0]
            .parse::<u32>()
            .map_err(|_| "Failed to parse width")?;
        let height = dims[1]
            .parse::<u32>()
            .map_err(|_| "Failed to parse height")?;

        Ok((width, height))
    }

    /// Build the complete FFmpeg merge command.
    ///
    /// Strategy (matching the desktop variant):
    ///   1. Loop video infinitely (`-stream_loop -1`) so it repeats if shorter than audio
    ///   2. Scale video to target dimensions
    ///   3. Overlay ASS subtitles if enabled
    ///   4. Use `-shortest` to trim output to the audio length
    pub fn build_merge_command(&self, config: &RenderConfig) -> Vec<String> {
        let mut args: Vec<String> = Vec::new();

        // ── Global flags ──────────────────────────────────────
        args.push("-y".into());

        // ── Input: video (loop infinitely) ────────────────────
        args.push("-stream_loop".into());
        args.push("-1".into());
        args.push("-i".into());
        args.push(config.video_path.to_string_lossy().to_string());

        // ── Input: audio files ────────────────────────────────
        for audio in &config.audio_paths {
            args.push("-i".into());
            args.push(audio.to_string_lossy().to_string());
        }

        // ── Input: calligraphy PNG (if present) ───────────────
        let has_calligraphy = config
            .surah_image_path
            .as_ref()
            .map(|p| p.exists())
            .unwrap_or(false);

        if has_calligraphy {
            args.push("-i".into());
            args.push(
                config
                    .surah_image_path
                    .as_ref()
                    .unwrap()
                    .to_string_lossy()
                    .to_string(),
            );
        }

        // ── Build audio filters (concatenation) ───────────────
        let mut filter_parts: Vec<String> = Vec::new();
        let num_audio = config.audio_paths.len();

        let mut audio_concat = String::new();
        for i in 1..=num_audio {
            audio_concat.push_str(&format!("[{}:a]", i));
        }
        audio_concat.push_str(&format!("concat=n={}:v=0:a=1[outa]", num_audio));
        filter_parts.push(audio_concat);

        // ── Build video filters ───────────────────────────────
        let mut vf_parts: Vec<String> = Vec::new();

        // ── Aspect ratio logic ───────────────────────────────
        let out_ar = config.width as f64 / config.height as f64;
        let is_out_1_1_or_4_5 = (out_ar - 1.0).abs() < 0.1 || (out_ar - 0.8).abs() < 0.1;
        let is_out_9_16 = (out_ar - 0.5625).abs() < 0.05;
        let is_out_16_9 = (out_ar - 1.777).abs() < 0.05;

        // Use output dimensions as default if input not probed
        let (in_w, in_h) = (
            config.input_width.unwrap_or(config.width),
            config.input_height.unwrap_or(config.height),
        );
        let in_ar = in_w as f64 / in_h as f64;
        let is_in_1_1_or_4_5 = (in_ar - 1.0).abs() < 0.1 || (in_ar - 0.8).abs() < 0.1;
        let is_in_16_9 = (in_ar - 1.777).abs() < 0.1;
        let is_in_9_16 = (in_ar - 0.5625).abs() < 0.1;

        if is_out_1_1_or_4_5 {
            // Rule 1: 1:1 or 4:5 > any > crop
            vf_parts.push(format!(
                "scale={}:{}:force_original_aspect_ratio=increase,crop={}:{}",
                config.width, config.height, config.width, config.height
            ));
        } else if is_out_9_16 {
            if is_in_1_1_or_4_5 {
                // Rule 2: 9:16 > 1:1 or 4:5 > fill
                vf_parts.push(format!(
                    "scale={}:{}:force_original_aspect_ratio=decrease,pad={}:{}:(ow-iw)/2:(oh-ih)/2:black",
                    config.width, config.height, config.width, config.height
                ));
            } else if is_in_16_9 {
                // Rule 3: 9:16 > 16:9 > crop to 1:1 then fill to 9:16
                vf_parts.push(format!(
                    "crop=ih:ih,scale={}:{}:force_original_aspect_ratio=decrease,pad={}:{}:(ow-iw)/2:(oh-ih)/2:black",
                    config.width, config.height, config.width, config.height
                ));
            } else {
                // Default Fit
                vf_parts.push(format!(
                    "scale={}:{}:force_original_aspect_ratio=decrease,pad={}:{}:(ow-iw)/2:(oh-ih)/2:black",
                    config.width, config.height, config.width, config.height
                ));
            }
        } else if is_out_16_9 {
            if is_in_1_1_or_4_5 {
                // Rule 4: 16:9 > 1:1 or 4:5 > fill
                vf_parts.push(format!(
                    "scale={}:{}:force_original_aspect_ratio=decrease,pad={}:{}:(ow-iw)/2:(oh-ih)/2:black",
                    config.width, config.height, config.width, config.height
                ));
            } else if is_in_9_16 {
                // Rule 5: 16:9 > 9:16 > crop to 1:1 then fill to 16:9
                vf_parts.push(format!(
                    "crop=iw:iw,scale={}:{}:force_original_aspect_ratio=decrease,pad={}:{}:(ow-iw)/2:(oh-ih)/2:black",
                    config.width, config.height, config.width, config.height
                ));
            } else {
                // Default Fit
                vf_parts.push(format!(
                    "scale={}:{}:force_original_aspect_ratio=decrease,pad={}:{}:(ow-iw)/2:(oh-ih)/2:black",
                    config.width, config.height, config.width, config.height
                ));
            }
        } else {
            // Default Catch-all Fit
            vf_parts.push(format!(
                "scale={}:{}:force_original_aspect_ratio=decrease,pad={}:{}:(ow-iw)/2:(oh-ih)/2:black",
                config.width, config.height, config.width, config.height
            ));
        }

        // Subtitle overlay
        if config.subtitle_enabled {
            if let Some(ref subtitle_path) = config.subtitle_path {
                let ext = subtitle_path
                    .extension()
                    .and_then(|e| e.to_str())
                    .unwrap_or("");
                let path_escaped = subtitle_path
                    .to_string_lossy()
                    .replace('\\', "/")
                    .replace(':', "\\:");

                if ext == "ass" || ext == "ssa" {
                    vf_parts.push(format!("ass='{}'", path_escaped));
                } else {
                    vf_parts.push(format!("subtitles='{}'", path_escaped));
                }
            }
        }

        // ── Combine filter graphs ─────────────────────────────
        if has_calligraphy {
            // When we have a calligraphy image we need a two-stage filter:
            // Stage 1: build the processed video as [base]
            // Stage 2: scale calligraphy PNG and overlay it
            let calligraphy_input_idx = 1 + num_audio; // 0=video, 1..N=audio, N+1=image
            let h = config.height as f64;
            let calligraphy_h = (h * 0.15).round() as u32;
            let y_offset = (h * 0.05).round() as u32;

            filter_parts.push(format!("[0:v]{}[base]", vf_parts.join(",")));
            filter_parts.push(format!(
                "[{}:v]scale=-1:{}[logo]",
                calligraphy_input_idx, calligraphy_h
            ));
            filter_parts.push(format!(
                "[base][logo]overlay=x=(main_w-overlay_w)/2:y={}[outv]",
                y_offset
            ));
        } else {
            filter_parts.push(format!("[0:v]{}[outv]", vf_parts.join(",")));
        }

        args.push("-filter_complex".into());
        args.push(filter_parts.join(";"));

        // ── Stream mapping ────────────────────────────────────
        args.push("-map".into());
        args.push("[outv]".into());
        args.push("-map".into());
        args.push("[outa]".into());

        // ── Video encoding ────────────────────────────────────
        args.push("-c:v".into());
        args.push("libx264".into());
        args.push("-preset".into());
        args.push("medium".into());
        args.push("-crf".into());
        args.push("23".into());
        args.push("-pix_fmt".into());
        args.push("yuv420p".into());

        // ── Audio encoding ────────────────────────────────────
        args.push("-c:a".into());
        args.push("aac".into());
        args.push("-b:a".into());
        args.push("192k".into());

        // ── Trim to audio length (video loops infinitely) ─────
        args.push("-shortest".into());

        // ── Fast-start for web/mobile playback ────────────────
        args.push("-movflags".into());
        args.push("+faststart".into());

        // ── Output ────────────────────────────────────────────
        args.push(config.output_path.to_string_lossy().to_string());

        args
    }

    pub async fn get_duration(&self, app: &AppHandle, path: &PathBuf) -> Result<f64, String> {
        // First try ffprobe for accurate duration
        let sidecar = app.shell().sidecar("ffprobe")
            .map_err(|e| format!("Failed to create ffprobe sidecar: {}", e))?;
            
        let output = sidecar
            .args([
                "-v",
                "quiet",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                &path.to_string_lossy(),
            ])
            .output()
            .await;

        if let Ok(output) = output {
            if output.status.success() {
                let duration_str = String::from_utf8_lossy(&output.stdout);
                if let Ok(duration) = duration_str.trim().parse::<f64>() {
                    if duration > 0.0 {
                        return Ok(duration);
                    }
                }
            }
        }

        // Fallback: estimate from file size (assumes ~128kbps MP3)
        // This is a safety measure if ffprobe is missing or fails
        let metadata =
            std::fs::metadata(path).map_err(|e| format!("Failed to read file metadata: {}", e))?;

        let file_size = metadata.len() as f64;
        let avg_bitrate = 128_000.0;
        let estimated_duration = (file_size * 8.0) / avg_bitrate;

        Ok(estimated_duration.max(1.0))
    }

    pub async fn execute(&self, app: &AppHandle, args: Vec<String>) -> Result<(), String> {
        eprintln!("[FFmpeg] Running sidecar with args: {}", args.join(" "));

        let sidecar = app.shell().sidecar("ffmpeg")
            .map_err(|e| format!("Failed to create ffmpeg sidecar: {}", e))?;

        // Note: We don't pipe stdin here since sidecar output handles it differently
        let output = sidecar
            .args(args)
            .output()
            .await
            .map_err(|e| format!("FFmpeg execution error: {}", e))?;

        if output.status.success() {
            Ok(())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let stdout = String::from_utf8_lossy(&output.stdout);

            let detail = if !stderr.is_empty() {
                stderr.to_string()
            } else {
                stdout.to_string()
            };

            // Log the full error for debugging
            eprintln!("[FFmpeg] FULL stderr:\n{}", detail);

            // Extract a meaningful error message
            let error_msg = extract_ffmpeg_error(&detail);

            Err(format!("FFmpeg failed: {}", error_msg))
        }
    }
}

impl Default for FFmpegService {
    fn default() -> Self {
        Self::new()
    }
}

/// Extract the most useful error message from FFmpeg stderr.
/// FFmpeg prints a lot of info before the actual error; grab the last
/// meaningful line that isn't just a version/config banner.
fn extract_ffmpeg_error(stderr: &str) -> String {
    // Look for lines with common FFmpeg error patterns
    let error_patterns = [
        "No such file or directory",
        "Invalid data found",
        "Permission denied",
        "codec not currently supported",
        "No space left on device",
        "Invalid argument",
        "does not contain",
        "Error",
        "error",
        "failed",
    ];

    // Collect the last 10 lines for context
    let lines: Vec<&str> = stderr.lines().collect();
    let tail = if lines.len() > 10 {
        &lines[lines.len() - 10..]
    } else {
        &lines
    };

    // Find the most specific error line
    for pattern in &error_patterns {
        for line in tail.iter().rev() {
            let trimmed = line.trim();
            if trimmed.contains(pattern) && !trimmed.is_empty() {
                return trimmed.to_string();
            }
        }
    }

    // Fallback: last non-empty line
    tail.iter()
        .rev()
        .find(|l| !l.trim().is_empty())
        .map(|l| l.trim().to_string())
        .unwrap_or_else(|| "unknown error".to_string())
}
