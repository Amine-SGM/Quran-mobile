mod commands;
mod services;

use commands::audio;
use commands::quran;
use commands::render;
use commands::settings;
use commands::video;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_ffmpeg::init())
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                match services::storage::get_setting(&handle, "auto_cleanup").await {
                    Ok(Some(val)) if val == "false" => return,
                    _ => {}
                }
                if let Err(e) = services::cache::clean_expired_cache(&handle) {
                    eprintln!("Startup cache cleanup failed: {}", e);
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            quran::get_surahs,
            quran::get_ayahs,
            quran::get_reciters,
            audio::download_audio,
            audio::get_audio_duration,
            video::select_video_file,
            video::search_pexels_videos,
            video::download_stock_video,
            render::start_render,
            render::get_job_status,
            render::cancel_job,
            render::save_to_gallery,
            render::share_video,
            settings::get_settings,
            settings::set_settings,
            settings::get_cache_stats,
            settings::clear_cache,
            settings::clean_expired_cache,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}