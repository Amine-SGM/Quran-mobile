use serde::{Deserialize, Serialize};

/// Request to execute an FFmpeg command on Android via FFmpegKit.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecuteRequest {
    /// The full command arguments (excluding the "ffmpeg" binary name itself).
    /// On Android, these will be joined and passed to FFmpegKit.execute().
    pub args: Vec<String>,
}

/// Response from an FFmpeg execution.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecuteResponse {
    /// FFmpeg return code (0 = success).
    pub return_code: i32,
    /// Combined log output from FFmpeg.
    pub output: String,
}

/// Request to probe media information (video dimensions, duration).
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaInfoRequest {
    /// Absolute path to the media file on the device.
    pub path: String,
}

/// Response containing probed media information.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaInfoResponse {
    /// Video width in pixels (0 if no video stream).
    pub width: u32,
    /// Video height in pixels (0 if no video stream).
    pub height: u32,
    /// Duration in seconds.
    pub duration: f64,
}

/// Request to get audio duration.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DurationRequest {
    /// Absolute path to the audio file on the device.
    pub path: String,
}

/// Response containing duration.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DurationResponse {
    /// Duration in seconds.
    pub duration: f64,
}
