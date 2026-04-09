use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PexelsVideoPicture {
    pub id: u32,
    pub picture: String,
    pub nr: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PexelsVideoFile {
    pub id: u32,
    pub quality: String,
    pub file_type: String,
    pub width: u32,
    pub height: u32,
    pub link: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PexelsVideo {
    pub id: u32,
    pub user_name: String,
    pub duration: f64,
    pub width: u32,
    pub height: u32,
    pub video_pictures: Vec<PexelsVideoPicture>,
    pub video_files: Vec<PexelsVideoFile>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchPexelsResponse {
    pub videos: Vec<PexelsVideo>,
    pub total_results: u32,
}

#[derive(Debug, Clone, Deserialize)]
struct PexelsApiResponse {
    videos: Vec<PexelsApiVideo>,
    total_results: u32,
}

#[derive(Debug, Clone, Deserialize)]
struct PexelsApiVideo {
    id: u32,
    user: PexelsApiUser,
    duration: f64,
    video_pictures: Vec<PexelsApiPicture>,
    video_files: Vec<PexelsApiFile>,
}

#[derive(Debug, Clone, Deserialize)]
struct PexelsApiUser {
    name: String,
}

#[derive(Debug, Clone, Deserialize)]
struct PexelsApiPicture {
    id: u32,
    picture: String,
    nr: u32,
}

#[derive(Debug, Clone, Deserialize)]
struct PexelsApiFile {
    id: u32,
    quality: String,
    file_type: String,
    width: u32,
    height: u32,
    link: String,
}

const PEXELS_API_BASE: &str = "https://api.pexels.com/videos";

pub async fn search_videos(
    api_key: &str,
    query: &str,
    orientation: Option<&str>,
    per_page: u32,
) -> Result<SearchPexelsResponse, String> {
    let client = reqwest::Client::new();

    let mut url = format!(
        "{}?query={}&per_page={}",
        PEXELS_API_BASE,
        urlencoding::encode(query),
        per_page
    );

    if let Some(orient) = orientation {
        url.push_str(&format!("&orientation={}", orient));
    }

    let response = client
        .get(&url)
        .header("Authorization", api_key)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API error: HTTP {}", response.status()));
    }

    let data: PexelsApiResponse = response
        .json()
        .await
        .map_err(|e| format!("Parse error: {}", e))?;

    let videos: Vec<PexelsVideo> = data
        .videos
        .into_iter()
        .map(|v| {
            let video_files: Vec<PexelsVideoFile> = v
                .video_files
                .into_iter()
                .map(|f| PexelsVideoFile {
                    id: f.id,
                    quality: f.quality,
                    file_type: f.file_type,
                    width: f.width,
                    height: f.height,
                    link: f.link,
                })
                .collect();

            let first_file = video_files.first();
            let width = first_file.map(|f| f.width).unwrap_or(0);
            let height = first_file.map(|f| f.height).unwrap_or(0);

            PexelsVideo {
                id: v.id,
                user_name: v.user.name,
                duration: v.duration,
                width,
                height,
                video_pictures: v
                    .video_pictures
                    .into_iter()
                    .map(|p| PexelsVideoPicture {
                        id: p.id,
                        picture: p.picture,
                        nr: p.nr,
                    })
                    .collect(),
                video_files,
            }
        })
        .collect();

    Ok(SearchPexelsResponse {
        videos,
        total_results: data.total_results,
    })
}

pub fn get_orientation(aspect_ratio: &str) -> Option<&'static str> {
    match aspect_ratio {
        "16:9" => Some("landscape"),
        "9:16" | "4:5" => Some("portrait"),
        "1:1" => Some("square"),
        _ => None,
    }
}

pub mod urlencoding {
    pub fn encode(s: &str) -> String {
        urlencoding::encode(s).to_string()
    }
}