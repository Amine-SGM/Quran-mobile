use crate::services::quran;
use serde::{Deserialize, Serialize};

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

impl From<quran::Surah> for Surah {
    fn from(s: quran::Surah) -> Self {
        Surah {
            number: s.number,
            arabic_name: s.arabic_name,
            english_name: s.english_name,
            english_name_translation: s.english_name_translation,
            revelation_type: s.revelation_type,
            total_ayahs: s.total_ayahs,
        }
    }
}

impl From<quran::Ayah> for Ayah {
    fn from(a: quran::Ayah) -> Self {
        Ayah {
            surah_number: a.surah_number,
            number: a.number,
            arabic_text: a.arabic_text,
            english_translation: a.english_translation,
        }
    }
}

impl From<quran::Reciter> for Reciter {
    fn from(r: quran::Reciter) -> Self {
        Reciter {
            id: r.id,
            name: r.name,
            arabic_name: r.arabic_name,
            style: r.style,
        }
    }
}

#[tauri::command]
pub async fn get_surahs() -> Result<Vec<Surah>, String> {
    let surahs: Vec<quran::Surah> = quran::fetch_surahs().await?;
    Ok(surahs.into_iter().map(Surah::from).collect())
}

#[tauri::command]
pub async fn get_ayahs(surah_number: u32, language: Option<String>) -> Result<Vec<Ayah>, String> {
    let ayahs: Vec<quran::Ayah> = quran::fetch_ayahs(surah_number, language).await?;
    Ok(ayahs.into_iter().map(Ayah::from).collect())
}

#[tauri::command]
pub async fn get_reciters() -> Result<Vec<Reciter>, String> {
    let reciters: Vec<quran::Reciter> = quran::fetch_reciters().await?;
    Ok(reciters.into_iter().map(Reciter::from).collect())
}