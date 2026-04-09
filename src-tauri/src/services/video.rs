use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoFileInfo {
    pub path: String,
    pub width: u32,
    pub height: u32,
    pub duration: f64,
    pub format: String,
}

pub fn get_video_metadata(file_path: &PathBuf) -> Result<VideoFileInfo, String> {
    let path_str = file_path.to_string_lossy().to_string();

    let output = Command::new("ffprobe")
        .args([
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            &path_str,
        ])
        .output()
        .map_err(|e| format!("Failed to run ffprobe: {}. Is FFmpeg installed?", e))?;

    if !output.status.success() {
        return Err("ffprobe failed to analyze video".to_string());
    }

    let json_str = String::from_utf8_lossy(&output.stdout);
    let json: serde_json::Value = serde_json::from_str(&json_str)
        .map_err(|e| format!("Failed to parse ffprobe output: {}", e))?;

    let format = json["format"]["format_name"]
        .as_str()
        .unwrap_or("unknown")
        .to_string();

    let duration = json["format"]["duration"]
        .as_str()
        .and_then(|s| s.parse::<f64>().ok())
        .unwrap_or(0.0);

    let video_stream = json["streams"]
        .as_array()
        .and_then(|streams| streams.iter().find(|s| s["codec_type"] == "video"));

    let (width, height) = if let Some(stream) = video_stream {
        let w = stream["width"].as_u64().unwrap_or(0) as u32;
        let h = stream["height"].as_u64().unwrap_or(0) as u32;
        (w, h)
    } else {
        (0, 0)
    };

    Ok(VideoFileInfo {
        path: path_str,
        width,
        height,
        duration,
        format,
    })
}
