use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::*;

/// Handle to the FFmpeg mobile plugin, wrapping the Tauri PluginApi.
pub struct Ffmpeg<R: Runtime>(pub(crate) PluginApi<R, ()>);

pub fn init<R: Runtime>(
    _app: &AppHandle<R>,
    api: PluginApi<R, ()>,
) -> crate::Result<Ffmpeg<R>> {
    Ok(Ffmpeg(api))
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
}
