export interface Surah {
  number: number;
  arabicName: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: "Meccan" | "Medinan";
  totalAyahs: number;
}

export interface Ayah {
  surahNumber: number;
  number: number;
  arabicText: string;
  englishTranslation?: string;
}

export interface Reciter {
  id: number;
  name: string;
  arabicName: string;
  style?: string;
  audioUrl?: string;
}

export type VideoSourceType = "upload" | "stock";

export interface VideoSource {
  type: VideoSourceType;
  localPath: string | null;
  stockVideoId: number | null;
  stockVideoUrl: string | null;
  width: number;
  height: number;
  duration: number;
}

export interface SubtitleConfig {
  enabled: boolean;
  fontSize: number;
  arabicColor: string;
  translationColor: string;
  position: "top" | "middle" | "bottom";
  showTranslation: boolean;
  translationFontSize: number;
  customText: string;
  highlightColor: string;
}

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export type AspectRatio = "9:16" | "1:1" | "4:5" | "16:9";

export type Resolution = "720p" | "1080p";

export interface RenderJob {
  id: string;
  status: JobStatus;
  surahNumber: number;
  ayahRangeStart: number;
  ayahRangeEnd: number;
  reciterId: number;
  videoSource: VideoSource;
  subtitleConfig: SubtitleConfig;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  outputPath: string | null;
  progress: number;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
}

export interface AppSettings {
  pexelsApiKey: string | null;
  exportResolution: Resolution;
  autoCleanup: boolean;
  showVideoPreview: boolean;
}

export interface OutputSettings {
  aspectRatio: AspectRatio;
  resolution: Resolution;
}

export interface PexelsVideo {
  id: number;
  userName: string;
  duration: number;
  width: number;
  height: number;
  videoPictures: Array<{
    id: number;
    picture: string;
    nr: number;
  }>;
  videoFiles: Array<{
    id: number;
    quality: string;
    fileType: string;
    width: number;
    height: number;
    link: string;
  }>;
}

export interface SearchPexelsResponse {
  videos: PexelsVideo[];
  totalResults: number;
}

export const DEFAULT_SUBTITLE_CONFIG: SubtitleConfig = {
  enabled: false,
  fontSize: 32,
  arabicColor: "#FFFFFF",
  translationColor: "#FFFFFF",
  position: "middle",
  showTranslation: false,
  translationFontSize: 24,
  customText: "",
  highlightColor: "#FFD700",
};

export const DEFAULT_OUTPUT_SETTINGS: OutputSettings = {
  aspectRatio: "9:16",
  resolution: "720p",
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  pexelsApiKey: null,
  exportResolution: "720p",
  autoCleanup: true,
  showVideoPreview: true,
};

export const MAX_AYAHS_PER_VIDEO = 10;

export const VALIDATION = {
  AYAH_RANGE: {
    MIN_AYAH: 1,
    MAX_AYAHS: 10,
  },
  SUBTITLE: {
    FONT_SIZE_MIN: 24,
    FONT_SIZE_MAX: 48,
    TRANSLATION_FONT_SIZE_MIN: 12,
    TRANSLATION_FONT_SIZE_MAX: 36,
  },
} as const;