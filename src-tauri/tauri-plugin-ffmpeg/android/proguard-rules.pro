# FFmpegKit proguard rules
-keep class com.antonkarpenko.ffmpegkit.** { *; }
-dontwarn com.antonkarpenko.ffmpegkit.**

-keep class com.plugin.ffmpeg.FfmpegPlugin { *; }
-keep class com.plugin.ffmpeg.ExecuteArgs { *; }
-keep class com.plugin.ffmpeg.PathArgs { *; }
