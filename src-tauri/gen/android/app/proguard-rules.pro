# FFmpegKit — prevent R8 from obfuscating JNI callback classes
-keep class com.antonkarpenko.ffmpegkit.** { *; }
-dontwarn com.antonkarpenko.ffmpegkit.**