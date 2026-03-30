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
    pub arabic_color: String,
    pub translation_color: String,
    pub position: String,
    pub show_translation: bool,
    pub translation_font_size: u32,
    pub surah_name: String,
    pub custom_text: String,
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
        let arabic_color = hex_to_ass_color(&config.arabic_color);
        let translation_color = hex_to_ass_color(&config.translation_color);
        let custom_text_color = "&H00FFFFFF";

        let outline_color = "&H00000000";
        let back_color = "&H80000000";

        // Horizontal margins: ~8% of width on each side to ensure text wraps before edges
        let margin_lr = config.width / 12;
        // Vertical margins: position text blocks relative to vertical center
        // Arabic (Alignment=2/bottom-center): MarginV = distance from bottom edge
        // Translation (Alignment=8/top-center): MarginV = distance from top edge
        // Both set to height/2 + gap so they sit just above/below center with a gap between them
        let center_gap = 20;
        let arabic_margin_v = config.height / 2 + center_gap;
        let translation_margin_v = config.height / 2 + center_gap;

        let mut styles = String::from(
            r#"[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding"#,
        );

        // Arabic style: Alignment=2 (bottom-center) — text grows upward from MarginV
        // This positions the bottom of the Arabic text block just above the vertical center
        styles.push_str(&format!(
            r#"
Style: Arabic,Noto Sans Arabic,{},{},{},{},{},1,0,0,0,100,100,0,0,1,2,1,2,{},{},{},1"#,
            config.font_size, arabic_color, arabic_color, outline_color, back_color,
            margin_lr, margin_lr, arabic_margin_v
        ));

        // Translation style: Alignment=8 (top-center) — text grows downward from MarginV
        // This positions the top of the translation text block just below the vertical center
        if config.show_translation {
            styles.push_str(&format!(
                r#"
Style: Translation,Noto Sans Arabic,{},{},{},{},{},0,0,0,0,100,100,0,0,1,2,1,8,{},{},{},1"#,
                config.translation_font_size,
                translation_color,
                translation_color,
                outline_color,
                back_color,
                margin_lr, margin_lr, translation_margin_v
            ));
        }

        if !config.custom_text.is_empty() {
            styles.push_str(&format!(
                r#"
Style: CustomText,Noto Sans Arabic,32,{},{},{},{},0,0,0,0,100,100,0,0,1,2,1,2,{},{},40,1"#,
                custom_text_color,
                custom_text_color,
                outline_color,
                back_color,
                margin_lr, margin_lr
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

        if !config.custom_text.is_empty() {
            events.push_str(&format!(
                r#"
Dialogue: 0,{},{},CustomText,,0,0,0,,{}"#,
                video_start, video_end, config.custom_text
            ));
        }

        // Process lines with segmentation
        let mut segmented_lines = Vec::new();
        for line in lines {
            segmented_lines.extend(self.segment_line(line, config));
        }

        for (_i, line) in segmented_lines.iter().enumerate() {
            let start = format_ass_time(line.start_time);
            let end = format_ass_time(line.end_time);

            // Arabic text — no \pos() so ASS uses style-based alignment + margins,
            // which enables automatic line wrapping for long ayahs
            events.push_str(&format!(
                r#"
Dialogue: 0,{},{},Arabic,,0,0,0,,{}"#,
                start, end, line.arabic_text
            ));

            if config.show_translation {
                if let Some(ref translation) = line.english_translation {
                    // Translation — same approach: rely on style alignment for wrapping
                    events.push_str(&format!(
                        r#"
Dialogue: 0,{},{},Translation,,0,0,0,,{}"#,
                        start, end, translation
                    ));
                }
            }
        }

        events
    }

    /// Splits a single subtitle line into multiple segments if the Arabic text is too long.
    /// This prevents overflows and makes for better reading pace.
    fn segment_line(&self, line: &SubtitleLine, config: &SubtitleRenderConfig) -> Vec<SubtitleLine> {
        let arabic_words: Vec<&str> = line.arabic_text.split_whitespace().collect();
        let total_arabic_words = arabic_words.len();
        if total_arabic_words == 0 {
            return vec![line.clone()];
        }

        // Heuristic: estimate words per line based on video width and font size.
        // For portrait (1080w) at size 32: 1080 / (32 * 5) ≈ 6-7 words.
        let words_per_line = ((config.width as f32 / (config.font_size as f32 * 5.0)).floor() as usize).max(6);
        
        let num_segments = (total_arabic_words as f32 / words_per_line as f32).ceil() as usize;

        if num_segments <= 1 {
            return vec![line.clone()];
        }

        let mut segments = Vec::new();
        let duration = line.end_time - line.start_time;
        let seg_duration = duration / num_segments as f64;

        // Split Arabic words as evenly as possible
        let arabic_words_per_seg = (total_arabic_words + num_segments - 1) / num_segments;

        // Split Translation words as evenly as possible (syncing with Arabic segments)
        let translation_words: Vec<&str> = if let Some(ref t) = line.english_translation {
            t.split_whitespace().collect()
        } else {
            Vec::new()
        };
        let trans_words_per_seg = if !translation_words.is_empty() {
            (translation_words.len() + num_segments - 1) / num_segments
        } else {
            0
        };

        for i in 0..num_segments {
            let a_start = i * arabic_words_per_seg;
            let a_end = ((i + 1) * arabic_words_per_seg).min(total_arabic_words);
            
            if a_start >= total_arabic_words {
                break;
            }

            let arabic_text = arabic_words[a_start..a_end].join(" ");
            
            let english_translation = if trans_words_per_seg > 0 {
                let t_start = i * trans_words_per_seg;
                let t_end = ((i + 1) * trans_words_per_seg).min(translation_words.len());
                if t_start < translation_words.len() {
                    Some(translation_words[t_start..t_end].join(" "))
                } else {
                    None
                }
            } else {
                None
            };

            segments.push(SubtitleLine {
                arabic_text,
                english_translation,
                start_time: line.start_time + (i as f64 * seg_duration),
                end_time: line.start_time + ((i + 1) as f64 * seg_duration),
            });
        }

        segments
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

fn hex_to_ass_color(hex: &str) -> String {
    if hex.len() == 7 && hex.starts_with("#") {
        let r = &hex[1..3];
        let g = &hex[3..5];
        let b = &hex[5..7];
        format!("&H00{}{}{}", b, g, r)
    } else {
        match hex {
            "yellow" => "&H0000FFFF".to_string(),
            _ => "&H00FFFFFF".to_string(),
        }
    }
}
