plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.plugin.ffmpeg"
    compileSdk = 36

    defaultConfig {
        minSdk = 26
        targetSdk = 36
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = "1.8"
    }
}

dependencies {
    // Tauri plugin API (provided by the host app)
    implementation(project(":tauri-android"))

    // FFmpegKit — LTS full-gpl variant: 16KB page-size aligned, includes libass/fribidi/x264
    // Using LTS instead of main-full to avoid the PLATFORM_hid_write symbol error in libavdevice.so
    // The main-full variant compiles libavdevice with hidapi which references symbols missing on Android.
    // The lts-full-gpl variant does not have this issue.
    implementation("io.github.jamaismagic.ffmpeg:ffmpeg-kit-lts-full-gpl-16kb:6.1.4")

    // Kotlin coroutines for async FFmpeg execution
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}
