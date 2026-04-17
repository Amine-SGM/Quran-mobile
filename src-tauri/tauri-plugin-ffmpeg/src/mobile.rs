use tauri::{
    plugin::{PluginApi, PluginHandle},
    AppHandle, Runtime,
};

use crate::models::*;

#[cfg(target_os = "android")]
const PLUGIN_IDENTIFIER: &str = "com.plugin.ffmpeg";

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_ffmpeg);

pub struct Ffmpeg<R: Runtime>(pub(crate) PluginHandle<R>);

pub fn init<R: Runtime>(_app: &AppHandle<R>, api: PluginApi<R, ()>) -> crate::Result<Ffmpeg<R>> {
    #[cfg(target_os = "android")]
    let handle = api.register_android_plugin(PLUGIN_IDENTIFIER, "FfmpegPlugin")?;
    #[cfg(target_os = "ios")]
    let handle = api.register_ios_plugin(init_plugin_ffmpeg)?;

    Ok(Ffmpeg(handle))
}

impl<R: Runtime> Ffmpeg<R> {
    pub fn execute(&self, args: Vec<String>) -> crate::Result<ExecuteResponse> {
        self.0
            .run_mobile_plugin("execute", ExecuteRequest { args })
            .map_err(Into::into)
    }

    pub fn get_media_information(&self, path: String) -> crate::Result<MediaInfoResponse> {
        self.0
            .run_mobile_plugin("getMediaInformation", MediaInfoRequest { path })
            .map_err(Into::into)
    }

    pub fn get_duration(&self, path: String) -> crate::Result<DurationResponse> {
        self.0
            .run_mobile_plugin("getDuration", DurationRequest { path })
            .map_err(Into::into)
    }

    #[cfg(target_os = "android")]
    pub fn save_to_gallery(&self, path: String) -> crate::Result<SaveToGalleryResponse> {
        self.0
            .run_mobile_plugin("saveToGallery", SaveToGalleryRequest { path })
            .map_err(Into::into)
    }

    #[cfg(target_os = "android")]
    pub fn share_video(&self, path: String) -> crate::Result<ShareVideoResponse> {
        self.0
            .run_mobile_plugin("shareVideo", ShareVideoRequest { path })
            .map_err(Into::into)
    }
}
