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

    // Build the libhidapi_stub.so via CMake.
    // libavdevice.so in ffmpeg-kit "full" builds references PLATFORM_hid_write
    // at load time (hidapi HID input device support). The stub satisfies the
    // dynamic linker so the app no longer crashes on startup.
    externalNativeBuild {
        cmake {
            path = file("CMakeLists.txt")
            version = "3.22.1"
        }
    }
}

dependencies {
    // Tauri plugin API (provided by the host app)
    implementation(project(":tauri-android"))

    // FFmpegKit — community-maintained fork with 16KB page-size support (Android 15+)
    // Using main-full-gpl-16kb for FFmpeg 6.1 codec support + libass/fribidi/freetype/x264
    // The PLATFORM_hid_write symbol issue from libavdevice.so is resolved by the
    // libhidapi_stub.so preloaded in FfmpegPlugin companion object before FFmpegKit init.
    implementation("io.github.jamaismagic.ffmpeg:ffmpeg-kit-main-full-gpl-16kb:6.1.4")

    // Kotlin coroutines for async FFmpeg execution
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}
