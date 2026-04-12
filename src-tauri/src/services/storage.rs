use std::path::PathBuf;
use tauri_plugin_store::StoreExt;

const PEXELS_KEY_ID: &str = "pexels_api_key";
const SETTINGS_STORE_PATH: &str = "settings.json";

pub async fn get_pexels_api_key(app: &tauri::AppHandle) -> Result<Option<String>, String> {
    let store = app
        .store(SETTINGS_STORE_PATH)
        .map_err(|e| format!("Store error: {}", e))?;

    let value = store
        .get(PEXELS_KEY_ID)
        .and_then(|v| v.as_str().map(|s| s.to_string()));

    Ok(value)
}

pub async fn set_pexels_api_key(app: &tauri::AppHandle, key: &str) -> Result<(), String> {
    let store = app
        .store(SETTINGS_STORE_PATH)
        .map_err(|e| format!("Store error: {}", e))?;

    store.set(PEXELS_KEY_ID, key);
    store.save().map_err(|e| format!("Save error: {}", e))?;

    Ok(())
}

pub async fn has_pexels_api_key(app: &tauri::AppHandle) -> Result<bool, String> {
    let key = get_pexels_api_key(app).await?;
    Ok(key.is_some() && !key.unwrap().is_empty())
}

pub async fn get_setting(app: &tauri::AppHandle, key: &str) -> Result<Option<String>, String> {
    let store = app
        .store(SETTINGS_STORE_PATH)
        .map_err(|e| format!("Store error: {}", e))?;

    let value = store
        .get(key)
        .and_then(|v| v.as_str().map(|s| s.to_string()));

    Ok(value)
}

pub async fn set_setting(app: &tauri::AppHandle, key: &str, value: &str) -> Result<(), String> {
    let store = app
        .store(SETTINGS_STORE_PATH)
        .map_err(|e| format!("Store error: {}", e))?;

    store.set(key, value);
    store.save().map_err(|e| format!("Save error: {}", e))?;

    Ok(())
}

pub async fn download_video(
    url: &str,
    cache_dir: PathBuf,
    filename: &str,
) -> Result<PathBuf, String> {
    let client = reqwest::Client::new();

    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Download failed: HTTP {}", response.status()));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    std::fs::create_dir_all(&cache_dir)
        .map_err(|e| format!("Failed to create cache dir: {}", e))?;

    let file_path = cache_dir.join(filename);

    std::fs::write(&file_path, &bytes).map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(file_path)
}
