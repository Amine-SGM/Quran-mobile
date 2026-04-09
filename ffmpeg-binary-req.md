# FFmpeg Binary Requirements Analysis

To keep the Android APK size minimal while maintaining full functionality, the FFmpeg binary should be compiled with only the necessary components. This analysis identifies the specific requirements based on the current `FFmpegService` and `RenderJob` implementations.

## 1. Core Encoders (Output)
These are mandatory for generating the final video file.
*   **`libx264`**: Required for the main video stream (`-c:v libx264`).
*   **`aac`**: Required for the audio stream (`-c:a aac`).

## 2. Decoders (Input)
These are required to read the input assets (recitations, background videos, and images).
*   **Video**: `h264`, `hevc` (to support majority of stock videos and user uploads).
*   **Audio**: `mp3` (primary format for Quran recitations from Quran.com), `aac`.
*   **Images**: `png` (required for the Surah calligraphy overlays).

## 3. Mandatory Filters (`-vf` / `-filter_complex`)
The app relies heavily on FFmpeg's filtering engine for layout and subtitles.
*   **`scale`**: Resizing background videos and calligraphy logos.
*   **`pad`**: Centering videos for different aspect ratios (9:16, 1:1, etc.).
*   **`overlay`**: Placing the calligraphy PNG on top of the video.
*   **`concat`**: Joining multiple ayah audio files into a single stream.
*   **`ass` / `subtitles`**: **CRITICAL.** This is used for rendering the Arabic and translation text. The current implementation uses complex word-by-word highlighting with inline overrides (`{\1c...}`) and BiDi markers.

## 4. External Libraries
These must be enabled during the FFmpeg build process (`--enable-lib...`).
*   **`libass`**: Required for advanced subtitle rendering. It must support high-quality text shaping for the new highlight feature.
*   **`fribidi`**: **MANDATORY.** Essential for the word-by-word highlight to align correctly in Right-to-Left (RTL) mode.
*   **`harfbuzz`**: **HIGHLY RECOMMENDED.** Required for proper Arabic character shaping (ligatures) when using inline color overrides within words.
*   **`freetype`**: Required by `libass` for font rendering.
*   **`fontconfig`**: Required to manage and locate system fonts (like Noto Sans Arabic).

## 5. Muxers, Demuxers & Protocols
*   **Muxers**: `mp4`, `mov` (for output).
*   **Demuxers**: `mov`, `mp4`, `m4a`, `mp3`, `image2` (for PNG), `concat`.
*   **Protocols**: `file` (the app downloads files to local storage before processing, so only the file protocol is strictly necessary for FFmpeg itself).

## 6. Binary Features
*   **`ffprobe`**: The project currently uses `ffprobe` in `FFmpegService::get_duration` to get accurate audio lengths.

---

> [!TIP]
> When compiling with `ffmpeg-android-maker`, use the `--enable-libx264 --enable-libass --enable-libfribidi` flags. You can use `--disable-everything` first and then selectively enable the items above to achieve a binary size potentially under 15-20MB per architecture.
