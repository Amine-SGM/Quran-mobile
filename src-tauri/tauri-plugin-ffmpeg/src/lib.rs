pub mod models;

#[cfg(any(target_os = "android", target_os = "ios"))]
mod mobile;

use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};

#[cfg(any(target_os = "android", target_os = "ios"))]
use tauri::Manager;

#[cfg(any(target_os = "android", target_os = "ios"))]
pub use mobile::Ffmpeg;

/// Error types for the FFmpeg plugin.
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("FFmpeg plugin error: {0}")]
    Plugin(String),
    #[error(transparent)]
    Tauri(#[from] tauri::Error),
    #[error("FFmpeg execution failed (rc={return_code}): {message}")]
    FfmpegFailed {
        return_code: i32,
        message: String,
    },
    #[error("Plugin invocation error: {0}")]
    PluginInvoke(String),
}

#[cfg(any(target_os = "android", target_os = "ios"))]
impl From<tauri::plugin::mobile::PluginInvokeError> for Error {
    fn from(e: tauri::plugin::mobile::PluginInvokeError) -> Self {
        Error::PluginInvoke(e.to_string())
    }
}

pub type Result<T> = std::result::Result<T, Error>;

impl From<Error> for String {
    fn from(e: Error) -> String {
        e.to_string()
    }
}

/// Initialize the FFmpeg plugin.
///
/// On Android, this sets up the bridge to ffmpeg-kit-android via Kotlin.
/// On desktop, this is a no-op (desktop uses shell sidecars instead).
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("ffmpeg")
        .setup(|app, api| {
            #[cfg(any(target_os = "android", target_os = "ios"))]
            {
                let handle = mobile::init(app, api)?;
                app.manage(handle);
            }

            // Desktop: nothing to set up here; FFmpegService uses sidecars directly.
            #[cfg(not(any(target_os = "android", target_os = "ios")))]
            {
                let _ = (app, api);
            }

            Ok(())
        })
        .build()
}
