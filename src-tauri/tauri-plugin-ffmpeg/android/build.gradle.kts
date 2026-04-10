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

    // FFmpegKit — community-maintained fork with 16KB page-size support
    implementation("io.github.jamaismagic.ffmpeg:ffmpeg-kit-main-full-16kb:6.1.4")

    // Kotlin coroutines for async FFmpeg execution
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}
