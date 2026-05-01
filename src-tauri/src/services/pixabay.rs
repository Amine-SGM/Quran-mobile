use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PixabayVideoFile {
    pub quality: String,
    pub width: u32,
    pub height: u32,
    pub link: String,
    pub size: u64,
    pub thumbnail: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PixabayVideo {
    pub id: u32,
    pub user_name: String,
    pub duration: f64,
    pub width: u32,
    pub height: u32,
    pub preview_url: String,
    pub video_files: Vec<PixabayVideoFile>,
    pub is_ai_generated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchPixabayResponse {
    pub videos: Vec<PixabayVideo>,
    pub total_results: u32,
}

#[derive(Debug, Clone, Deserialize)]
struct PixabayApiResponse {
    total: u32,
    #[serde(rename = "totalHits")]
    total_hits: u32,
    hits: Vec<PixabayApiVideo>,
}

#[derive(Debug, Clone, Deserialize)]
struct PixabayApiVideo {
    id: u32,
    user: String,
    duration: u32,
    videos: PixabayApiVideoVariants,
    #[serde(default)]
    #[serde(alias = "is_ai_generated", alias = "ai_generated", alias = "is_ai")]
    is_ai_generated: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
struct PixabayApiVideoVariants {
    #[serde(default)]
    large: Option<PixabayApiVideoFile>,
    #[serde(default)]
    medium: Option<PixabayApiVideoFile>,
    #[serde(default)]
    small: Option<PixabayApiVideoFile>,
    #[serde(default)]
    tiny: Option<PixabayApiVideoFile>,
}

#[derive(Debug, Clone, Deserialize)]
struct PixabayApiVideoFile {
    url: String,
    width: u32,
    height: u32,
    size: u64,
    thumbnail: String,
}

const PIXABAY_API_BASE: &str = "https://pixabay.com/api/videos/";

pub async fn search_videos(
    api_key: &str,
    query: &str,
    min_width: Option<u32>,
    min_height: Option<u32>,
    page: u32,
    per_page: u32,
) -> Result<SearchPixabayResponse, String> {
    let client = reqwest::Client::new();

    let mut url = format!(
        "{}?key={}&q={}&per_page={}&page={}",
        PIXABAY_API_BASE,
        api_key,
        urlencoding::encode(query),
        per_page,
        page
    );

    if let Some(w) = min_width {
        url.push_str(&format!("&min_width={}", w));
    }

    if let Some(h) = min_height {
        url.push_str(&format!("&min_height={}", h));
    }

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API error: HTTP {}", response.status()));
    }

    let text = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    let data: PixabayApiResponse = serde_json::from_str(&text)
        .map_err(|e| format!("Parse error: {}. Response: {}", e, text.chars().take(200).collect::<String>()))?;

    let videos = data
        .hits
        .into_iter()
        .filter_map(|hit| {
            let mut files = collect_variants(hit.videos);
            if files.is_empty() {
                return None;
            }

            files.sort_by(|a, b| (b.width * b.height).cmp(&(a.width * a.height)));
            let best = files.first();
            let width = best.map(|f| f.width).unwrap_or(0);
            let height = best.map(|f| f.height).unwrap_or(0);
            let preview_url = best.map(|f| f.thumbnail.clone()).unwrap_or_default();

            Some(PixabayVideo {
                id: hit.id,
                user_name: hit.user,
                duration: hit.duration as f64,
                width,
                height,
                preview_url,
                video_files: files,
                is_ai_generated: hit.is_ai_generated.unwrap_or(false),
            })
        })
        .collect();

    Ok(SearchPixabayResponse {
        videos,
        total_results: data.total_hits,
    })
}

fn collect_variants(variants: PixabayApiVideoVariants) -> Vec<PixabayVideoFile> {
    let mut files = Vec::new();

    if let Some(file) = variants.large {
        push_variant(&mut files, "large", file);
    }

    if let Some(file) = variants.medium {
        push_variant(&mut files, "medium", file);
    }

    if let Some(file) = variants.small {
        push_variant(&mut files, "small", file);
    }

    if let Some(file) = variants.tiny {
        push_variant(&mut files, "tiny", file);
    }

    files
}

fn push_variant(files: &mut Vec<PixabayVideoFile>, quality: &str, file: PixabayApiVideoFile) {
    if file.url.is_empty() {
        return;
    }

    files.push(PixabayVideoFile {
        quality: quality.to_string(),
        width: file.width,
        height: file.height,
        link: file.url,
        size: file.size,
        thumbnail: file.thumbnail,
    });
}
