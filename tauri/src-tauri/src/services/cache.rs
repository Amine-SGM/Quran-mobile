use std::path::PathBuf;
use std::time::{Duration, SystemTime};
use tauri::{AppHandle, Manager};

const CACHE_TTL_HOURS: u64 = 3;
const CACHE_EXTENSIONS: &[&str] = &["mp4", "mp3", "wav", "png", "jpg", "jpeg", "webm"];

#[derive(Debug, Clone)]
pub struct CacheStats {
    pub total_files: u32,
    pub total_size_bytes: u64,
    pub oldest_file_age_seconds: Option<u64>,
}

pub fn get_cache_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let cache_dir = app
        .path()
        .app_cache_dir()
        .map_err(|e| format!("Failed to get cache dir: {}", e))?;

    std::fs::create_dir_all(&cache_dir)
        .map_err(|e| format!("Failed to create cache dir: {}", e))?;

    Ok(cache_dir)
}

pub fn get_cache_stats(app: &AppHandle) -> Result<CacheStats, String> {
    let cache_dir = get_cache_dir(app)?;

    let mut total_files = 0u32;
    let mut total_size_bytes = 0u64;
    let mut oldest_modified: Option<SystemTime> = None;

    if cache_dir.exists() {
        let entries = std::fs::read_dir(&cache_dir)
            .map_err(|e| format!("Failed to read cache dir: {}", e))?;

        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() && is_cache_file(&path) {
                total_files += 1;
                if let Ok(metadata) = entry.metadata() {
                    total_size_bytes += metadata.len();
                    if let Ok(modified) = metadata.modified() {
                        if oldest_modified.is_none() || Some(modified) < oldest_modified {
                            oldest_modified = Some(modified);
                        }
                    }
                }
            }
        }
    }

    let oldest_file_age_seconds = oldest_modified.map(|t| {
        SystemTime::now()
            .duration_since(t)
            .unwrap_or(Duration::ZERO)
            .as_secs()
    });

    Ok(CacheStats {
        total_files,
        total_size_bytes,
        oldest_file_age_seconds,
    })
}

pub fn clean_expired_cache(app: &AppHandle) -> Result<(u32, u64), String> {
    let cache_dir = get_cache_dir(app)?;
    let ttl = Duration::from_secs(CACHE_TTL_HOURS * 3600);
    let now = SystemTime::now();

    let mut deleted_files = 0u32;
    let mut freed_bytes = 0u64;

    if cache_dir.exists() {
        let entries = std::fs::read_dir(&cache_dir)
            .map_err(|e| format!("Failed to read cache dir: {}", e))?;

        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() && is_cache_file(&path) {
                if let Ok(metadata) = entry.metadata() {
                    if let Ok(modified) = metadata.modified() {
                        if now.duration_since(modified).unwrap_or(Duration::ZERO) > ttl {
                            freed_bytes += metadata.len();
                            std::fs::remove_file(&path).ok();
                            deleted_files += 1;
                        }
                    }
                }
            }
        }
    }

    Ok((deleted_files, freed_bytes))
}

pub fn clean_all_cache(app: &AppHandle) -> Result<(u32, u64), String> {
    let cache_dir = get_cache_dir(app)?;

    let mut deleted_files = 0u32;
    let mut freed_bytes = 0u64;

    if cache_dir.exists() {
        let entries = std::fs::read_dir(&cache_dir)
            .map_err(|e| format!("Failed to read cache dir: {}", e))?;

        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() && is_cache_file(&path) {
                if let Ok(metadata) = entry.metadata() {
                    freed_bytes += metadata.len();
                }
                std::fs::remove_file(&path).ok();
                deleted_files += 1;
            }
        }
    }

    Ok((deleted_files, freed_bytes))
}

fn is_cache_file(path: &PathBuf) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| CACHE_EXTENSIONS.contains(&ext.to_lowercase().as_str()))
        .unwrap_or(false)
}
