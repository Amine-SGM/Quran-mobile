use tauri::{
    plugin::{PluginApi, PluginHandle},
    AppHandle, Runtime,
};

use crate::models::*;

#[cfg(target_os = "android")]
const PLUGIN_IDENTIFIER: &str = "com.plugin.ffmpeg";

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_ffmpeg);

/// Handle to the FFmpeg mobile plugin, wrapping the Tauri PluginHandle.
pub struct Ffmpeg<R: Runtime>(pub(crate) PluginHandle<R>);

pub fn init<R: Runtime>(_app: &AppHandle<R>, api: PluginApi<R, ()>) -> crate::Result<Ffmpeg<R>> {
    #[cfg(target_os = "android")]
    let handle = api.register_android_plugin(PLUGIN_IDENTIFIER, "FfmpegPlugin")?;
    #[cfg(target_os = "ios")]
    let handle = api.register_ios_plugin(init_plugin_ffmpeg)?;

    Ok(Ffmpeg(handle))
}

impl<R: Runtime> Ffmpeg<R> {
    /// Execute an FFmpeg command via FFmpegKit on Android.
    ///
    /// `args` should be the full argument list (same as what you'd pass to
    /// the FFmpeg CLI, excluding the `ffmpeg` binary name itself).
    pub fn execute(&self, args: Vec<String>) -> crate::Result<ExecuteResponse> {
        self.0
            .run_mobile_plugin("execute", ExecuteRequest { args })
            .map_err(Into::into)
    }

    /// Probe a media file for video dimensions and duration.
    pub fn get_media_information(&self, path: String) -> crate::Result<MediaInfoResponse> {
        self.0
            .run_mobile_plugin("getMediaInformation", MediaInfoRequest { path })
            .map_err(Into::into)
    }

    /// Get the duration of an audio/video file in seconds.
    pub fn get_duration(&self, path: String) -> crate::Result<DurationResponse> {
        self.0
            .run_mobile_plugin("getDuration", DurationRequest { path })
            .map_err(Into::into)
    }

    /// Probe a video file using Android's native MediaMetadataRetriever.
    /// This avoids loading FFmpegKit native libraries, preventing the
    /// libavdevice.so crash on the `video` variant.
    pub fn get_video_metadata(&self, path: String) -> crate::Result<MediaInfoResponse> {
        self.0
            .run_mobile_plugin("getVideoMetadata", MediaInfoRequest { path })
            .map_err(Into::into)
    }
}
