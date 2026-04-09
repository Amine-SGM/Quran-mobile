use serde::{Deserialize, Serialize};
use std::collections::HashMap;

const QURAN_API_BASE: &str = "https://api.quran.com/api/v4";

// ── Public types ──────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Surah {
    pub number: u32,
    pub arabic_name: String,
    pub english_name: String,
    pub english_name_translation: String,
    pub revelation_type: String,
    pub total_ayahs: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Ayah {
    pub surah_number: u32,
    pub number: u32,
    pub arabic_text: String,
    pub english_translation: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reciter {
    pub id: u32,
    pub name: String,
    pub arabic_name: String,
    pub style: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioFileEntry {
    pub verse_key: String,
    pub url: String,
    pub segments: Option<Vec<(f64, f64)>>,
}

// ── Private API response types ────────────────────────────────────

#[derive(Debug, Deserialize)]
struct ChaptersApiResponse {
    chapters: Vec<ChapterData>,
}

#[derive(Debug, Deserialize)]
struct ChapterData {
    id: u32,
    name_arabic: Option<String>,
    name_simple: Option<String>,
    translated_name: Option<TranslatedName>,
    revelation_place: Option<String>,
    verses_count: Option<u32>,
}

#[derive(Debug, Deserialize)]
struct TranslatedName {
    name: Option<String>,
}

#[derive(Debug, Deserialize)]
struct VersesApiResponse {
    verses: Vec<VerseData>,
}

#[derive(Debug, Deserialize)]
struct VerseData {
    verse_number: u32,
    text_uthmani: Option<String>,
    translations: Option<Vec<TranslationData>>,
}

#[derive(Debug, Deserialize)]
struct TranslationData {
    text: Option<String>,
}

#[derive(Debug, Deserialize)]
struct RecitationsApiResponse {
    recitations: Vec<RecitationData>,
}

#[derive(Debug, Deserialize)]
struct RecitationData {
    id: u32,
    reciter_name: Option<String>,
    translated_name: Option<TranslatedName>,
    style: Option<String>,
}

#[derive(Debug, Deserialize)]
struct AudioFilesApiResponse {
    audio_files: Vec<AudioFileData>,
}

#[derive(Debug, Deserialize)]
struct ChapterRecitationApiResponse {
    audio_file: ChapterAudioFileData,
}

#[derive(Debug, Deserialize)]
struct ChapterAudioFileData {
    timestamps: Vec<ChapterTimestampData>,
}

#[derive(Debug, Deserialize)]
struct ChapterTimestampData {
    verse_key: String,
    timestamp_from: f64,
    segments: Option<Vec<Vec<f64>>>,
}

#[derive(Debug, Deserialize)]
struct AudioFileData {
    verse_key: String,
    url: String,
    segments: Option<Vec<Vec<u32>>>,
}

// ── HTTP helper ───────────────────────────────────────────────────

async fn api_get<T: serde::de::DeserializeOwned>(url: &str) -> Result<T, String> {
    let client = reqwest::Client::new();
    let response = client
        .get(url)
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Quran.com API error: HTTP {}",
            response.status()
        ));
    }

    response
        .json::<T>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

// ── Public functions ──────────────────────────────────────────────

/// Fetch all 114 surahs.
/// GET /chapters?language=en
pub async fn fetch_surahs() -> Result<Vec<Surah>, String> {
    let data: ChaptersApiResponse =
        api_get(&format!("{}/chapters?language=en", QURAN_API_BASE)).await?;

    let surahs = data
        .chapters
        .into_iter()
        .map(|c| {
            let english_name = c
                .translated_name
                .as_ref()
                .and_then(|t| t.name.clone())
                .or_else(|| c.name_simple.clone())
                .unwrap_or_default();

            let revelation_type = match c.revelation_place.as_deref() {
                Some("madinah") => "Medinan",
                _ => "Meccan",
            };

            Surah {
                number: c.id,
                arabic_name: c.name_arabic.unwrap_or_default(),
                english_name,
                english_name_translation: c.name_simple.unwrap_or_default(),
                revelation_type: revelation_type.to_string(),
                total_ayahs: c.verses_count.unwrap_or(0),
            }
        })
        .collect();

    Ok(surahs)
}

/// Fetch surah name by number.
pub async fn fetch_surah_name(surah_number: u32) -> Result<String, String> {
    let surahs = fetch_surahs().await?;
    surahs
        .iter()
        .find(|s| s.number == surah_number)
        .map(|s| s.arabic_name.clone())
        .ok_or_else(|| format!("Surah {} not found", surah_number))
}

/// Fetch ayahs for a chapter.
pub async fn fetch_ayahs(
    surah_number: u32,
    language: Option<String>,
) -> Result<Vec<Ayah>, String> {
    let lang = language.unwrap_or_else(|| "en".to_string());
    let url = format!(
        "{}/verses/by_chapter/{}?language={}&fields=text_uthmani&translations=20&per_page=300",
        QURAN_API_BASE, surah_number, lang
    );

    let data: VersesApiResponse = api_get(&url).await?;

    let ayahs = data
        .verses
        .into_iter()
        .map(|v| {
            let english_translation = v
                .translations
                .as_ref()
                .and_then(|ts| ts.first())
                .and_then(|t| t.text.clone())
                .map(|text| strip_html_tags(&text));

            Ayah {
                surah_number,
                number: v.verse_number,
                arabic_text: v.text_uthmani.unwrap_or_default(),
                english_translation,
            }
        })
        .collect();

    Ok(ayahs)
}

/// Fetch available reciters, filtering only for those who support word-level highlighting (karaoke).
/// GET /resources/recitations
pub async fn fetch_reciters() -> Result<Vec<Reciter>, String> {
    let data: RecitationsApiResponse =
        api_get(&format!("{}/resources/recitations", QURAN_API_BASE)).await?;

    // Known reciter IDs that are missing word-level timing data (segments) in the Quran.com API,
    // or specifically excluded by user request.
    let excluded_ids = [3, 11, 12, 13, 14, 15, 20, 100, 106];

    let reciters = data
        .recitations
        .into_iter()
        .filter(|r| !excluded_ids.contains(&r.id))
        .map(|r| {
            let base_name = r
                .reciter_name
                .or_else(|| {
                    r.translated_name
                        .as_ref()
                        .and_then(|t| t.name.clone())
                })
                .unwrap_or_default();

            let display_name = if let Some(ref style) = r.style {
                format!("{} — {}", base_name, style)
            } else {
                base_name.clone()
            };

            Reciter {
                id: r.id,
                name: display_name,
                arabic_name: base_name,
                style: r.style,
            }
        })
        .collect();

    Ok(reciters)
}

/// Fetch audio URLs for all ayahs in a chapter for a specific reciter.
pub async fn fetch_audio_urls(
    reciter_id: u32,
    chapter_number: u32,
) -> Result<Vec<AudioFileEntry>, String> {
    let url = format!(
        "{}/recitations/{}/by_chapter/{}?per_page=300&segments=true",
        QURAN_API_BASE, reciter_id, chapter_number
    );
    let data: AudioFilesApiResponse = api_get(&url).await?;

    let entries = data
        .audio_files
        .into_iter()
        .map(|af| {
            let full_url = normalise_audio_url(&af.url);
            let segments = af.segments.map(|segs| {
                segs.into_iter()
                    .filter(|s| s.len() >= 3)
                    .map(|s| (s[1] as f64 / 1000.0, s[2] as f64 / 1000.0))
                    .collect()
            });

            AudioFileEntry {
                verse_key: af.verse_key,
                url: full_url,
                segments,
            }
        })
        .collect();

    Ok(entries)
}

/// Fetch per-verse word timings from the chapter_recitations endpoint.
pub async fn fetch_chapter_word_timings(
    reciter_id: u32,
    chapter_number: u32,
) -> Result<HashMap<String, Vec<(f64, f64)>>, String> {
    let url = format!(
        "{}/chapter_recitations/{}/{}?segments=true",
        QURAN_API_BASE, reciter_id, chapter_number
    );
    let data: ChapterRecitationApiResponse = api_get(&url).await?;

    Ok(convert_chapter_timestamps(data.audio_file.timestamps))
}

// ── Helpers ───────────────────────────────────────────────────────

/// Strip simple HTML tags from translation text.
fn strip_html_tags(text: &str) -> String {
    let mut result = String::with_capacity(text.len());
    let mut inside_tag = false;
    for ch in text.chars() {
        match ch {
            '<' => inside_tag = true,
            '>' => inside_tag = false,
            _ if !inside_tag => result.push(ch),
            _ => {}
        }
    }
    result
}

/// Normalise audio URLs from the Quran.com API.
fn normalise_audio_url(raw: &str) -> String {
    if raw.starts_with("//") {
        format!("https:{}", raw)
    } else if raw.starts_with("http") {
        raw.to_string()
    } else {
        format!("https://verses.quran.com/{}", raw)
    }
}

fn convert_chapter_timestamps(
    timestamps: Vec<ChapterTimestampData>,
) -> HashMap<String, Vec<(f64, f64)>> {
    timestamps
        .into_iter()
        .filter_map(|timestamp| {
            let segments = timestamp.segments?;

            let timings: Vec<(f64, f64)> = segments
                .into_iter()
                .filter(|segment| segment.len() >= 3)
                .filter_map(|segment| {
                    let start = ((segment[1] - timestamp.timestamp_from).max(0.0)) / 1000.0;
                    let end = ((segment[2] - timestamp.timestamp_from).max(0.0)) / 1000.0;

                    if end > start {
                        Some((start, end))
                    } else {
                        None
                    }
                })
                .collect();

            if timings.is_empty() {
                None
            } else {
                Some((timestamp.verse_key, timings))
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn converts_chapter_timestamps_to_relative_timings() {
        let timings = convert_chapter_timestamps(vec![ChapterTimestampData {
            verse_key: "1:2".to_string(),
            timestamp_from: 6090.0,
            segments: Some(vec![
                vec![1.0, 6025.0, 7025.0],
                vec![2.0, 7025.0, 7885.0],
                vec![3.0, 7885.0, 8515.0],
            ]),
        }]);

        let verse_timings = timings.get("1:2").expect("missing verse timings");
        assert_eq!(verse_timings.len(), 3);
        assert!((verse_timings[0].0 - 0.0).abs() < 1e-6);
        assert!((verse_timings[0].1 - 0.935).abs() < 1e-6);
        assert!((verse_timings[1].0 - 0.935).abs() < 1e-6);
        assert!((verse_timings[1].1 - 1.795).abs() < 1e-6);
    }

    #[test]
    fn ignores_malformed_segments_from_chapter_timestamps() {
        let timings = convert_chapter_timestamps(vec![ChapterTimestampData {
            verse_key: "1:3".to_string(),
            timestamp_from: 11680.0,
            segments: Some(vec![
                vec![1.0, 11615.0, 12855.0],
                vec![1.0],
                vec![2.0, 12855.0, 16180.0],
                vec![2.0],
            ]),
        }]);

        let verse_timings = timings.get("1:3").expect("missing verse timings");
        assert_eq!(verse_timings.len(), 2);
        assert!((verse_timings[0].0 - 0.0).abs() < 1e-6);
        assert!((verse_timings[1].0 - 1.175).abs() < 1e-6);
    }
}
