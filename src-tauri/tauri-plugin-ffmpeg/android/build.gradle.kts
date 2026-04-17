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
            consumerProguardFiles("proguard-rules.pro")
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

    // FFmpegKit — antonkarpenko fork (FFmpeg 8.0, no hidapi crash, includes x264/libass)
    implementation("com.antonkarpenko:ffmpeg-kit-full-gpl:2.1.0")

    // Kotlin coroutines for async FFmpeg execution
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // AndroidX Core for FileProvider (share video)
    implementation("androidx.core:core-ktx:1.12.0")
}
