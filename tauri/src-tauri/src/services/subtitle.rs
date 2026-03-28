use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleLine {
    pub arabic_text: String,
    pub english_translation: Option<String>,
    pub start_time: f64,
    pub end_time: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleRenderConfig {
    pub font_size: u32,
    pub color: String,
    pub position: String,
    pub show_translation: bool,
    pub translation_font_size: u32,
    pub surah_name: String,
    pub width: u32,
    pub height: u32,
}

pub struct SubtitleService;

impl SubtitleService {
    pub fn new() -> Self {
        Self
    }

    pub fn generate_ass_file(
        &self,
        lines: &[SubtitleLine],
        config: &SubtitleRenderConfig,
        output_path: &PathBuf,
    ) -> Result<PathBuf, String> {
        let header = self.generate_ass_header(config);
        let styles = self.generate_ass_styles(config);
        let events = self.generate_ass_events(lines, config);

        let content = format!("{}\n{}\n{}", header, styles, events);

        std::fs::write(output_path, content)
            .map_err(|e| format!("Failed to write ASS file: {}", e))?;

        Ok(output_path.clone())
    }

    fn generate_ass_header(&self, config: &SubtitleRenderConfig) -> String {
        format!(
            r#"[Script Info]
Title: Quran Subtitles
ScriptType: v4.00+
WrapStyle: 0
PlayResX: {}
PlayResY: {}
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709"#,
            config.width, config.height
        )
    }

    fn generate_ass_styles(&self, config: &SubtitleRenderConfig) -> String {
        let primary_color = match config.color.as_str() {
            "yellow" => "&H0000FFFF",
            _ => "&H00FFFFFF",
        };

        let outline_color = "&H00000000";
        let back_color = "&H80000000";

        let mut styles = String::from(
            r#"[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding"#,
        );

        // Arabic style: Center-Bottom alignment for use with middle-centered positioning
        styles.push_str(&format!(
            r#"
Style: Arabic,Noto Sans Arabic,{},{},{},{},{},1,0,0,0,100,100,0,0,1,2,1,2,20,20,0,1"#,
            config.font_size, primary_color, primary_color, outline_color, back_color
        ));

        // Translation style: Center-Top alignment for use with middle-centered positioning
        if config.show_translation {
            styles.push_str(&format!(
                r#"
Style: Translation,Noto Sans Arabic,{},{},{},{},{},0,0,0,0,100,100,0,0,1,2,1,8,20,20,0,1"#,
                config.translation_font_size,
                primary_color,
                primary_color,
                outline_color,
                back_color
            ));
        }

        styles
    }

    fn generate_ass_events(&self, lines: &[SubtitleLine], config: &SubtitleRenderConfig) -> String {
        let mut events = String::from(
            r#"
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"#,
        );

        let total_duration = lines.last().map(|l| l.end_time).unwrap_or(3.0);
        let video_start = format_ass_time(0.0);
        let video_end = format_ass_time(total_duration);

        let center_x = config.width / 2;
        let center_y = config.height / 2;

        for (_i, line) in lines.iter().enumerate() {
            let start = format_ass_time(line.start_time);
            let end = format_ass_time(line.end_time);

            // Arabic text: \pos at absolute center, but style Alignment=2 means it sits ABOVE the point
            events.push_str(&format!(
                r#"
Dialogue: 0,{},{},Arabic,,0,0,0,,{{\pos({}, {})}}{}"#,
                start, end, center_x, center_y - 10, line.arabic_text
            ));

            if config.show_translation {
                if let Some(ref translation) = line.english_translation {
                    // Translation: \pos at same center, but style Alignment=8 means it sits BELOW the point
                    events.push_str(&format!(
                        r#"
Dialogue: 0,{},{},Translation,,0,0,0,,{{\pos({}, {})}}{}"#,
                        start, end, center_x, center_y + 10, translation
                    ));
                }
            }
        }

        events
    }

    pub fn estimate_line_durations(&self, texts: &[String], total_duration: f64) -> Vec<f64> {
        if texts.is_empty() {
            return vec![];
        }

        let avg_duration = total_duration / texts.len() as f64;

        texts
            .iter()
            .map(|text| {
                let word_count = text.split_whitespace().count() as f64;
                let base_duration = avg_duration;
                let duration = base_duration * (word_count / 5.0).clamp(0.8, 1.5);
                duration.clamp(1.5, 8.0)
            })
            .collect()
    }
}

impl Default for SubtitleService {
    fn default() -> Self {
        Self::new()
    }
}

fn format_ass_time(seconds: f64) -> String {
    let hours = (seconds / 3600.0) as u32;
    let minutes = ((seconds % 3600.0) / 60.0) as u32;
    let secs = (seconds % 60.0) as u32;
    let centisecs = ((seconds * 100.0) % 100.0) as u32;

    format!("{}:{:02}:{:02}.{:02}", hours, minutes, secs, centisecs)
}
