package com.plugin.ffmpeg

import android.app.Activity
import android.content.ContentResolver
import android.content.ContentValues
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import androidx.core.content.FileProvider
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import com.antonkarpenko.ffmpegkit.FFmpegKit
import com.antonkarpenko.ffmpegkit.FFmpegKitConfig
import com.antonkarpenko.ffmpegkit.FFprobeKit
import com.antonkarpenko.ffmpegkit.ReturnCode
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileInputStream

@InvokeArg
class ExecuteArgs {
    var args: List<String> = emptyList()
}

@InvokeArg
class PathArgs {
    var path: String = ""
}

/**
 * Tauri plugin that wraps ffmpeg-kit-android to provide native FFmpeg/FFprobe
 * functionality on Android. Commands are invoked from Rust via run_mobile_plugin.
 */
@TauriPlugin
class FfmpegPlugin(private val activity: Activity) : Plugin(activity) {

    companion object {
        private const val TAG = "FfmpegPlugin"
    }

    private fun resolvePathForFFmpeg(path: String): String {
        if (!path.startsWith("content://")) return path

        val uri = Uri.parse(path)
        val resolver: ContentResolver = activity.contentResolver
        val tempFile = File.createTempFile("ffmpeg_input_", ".mp4", activity.cacheDir)

        resolver.openInputStream(uri)?.use { input ->
            tempFile.outputStream().use { output ->
                input.copyTo(output)
            }
        } ?: throw IllegalStateException("Cannot open content URI: $path")

        Log.d(TAG, "Copied content:// URI to temp file: ${tempFile.absolutePath}")
        return tempFile.absolutePath
    }

    /**
     * Execute an FFmpeg command.
     *
     * Expects JSON payload: { "args": ["arg1", "arg2", ...] }
     * Returns: { "returnCode": 0, "output": "..." }
     *
     * Runs on a background thread via coroutines to avoid blocking the UI.
     */
    @Command
    fun execute(invoke: Invoke) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val args = invoke.parseArgs(ExecuteArgs::class.java)
                val resolvedArgs = args.args.map { arg ->
                    if (arg.startsWith("content://")) resolvePathForFFmpeg(arg) else arg
                }

                Log.d(TAG, "Executing FFmpeg command: ${resolvedArgs.joinToString(" ")}")

                FFmpegKitConfig.setEnvironmentVariable("FONTCONFIG_PATH", "/dev/null")

                val session = FFmpegKit.execute(resolvedArgs.joinToString(" "))
                val returnCode = session.returnCode
                val output = session.allLogsAsString ?: ""

                val ret = JSObject()
                ret.put("returnCode", if (ReturnCode.isSuccess(returnCode)) 0 else returnCode.value)
                ret.put("output", output)

                if (ReturnCode.isSuccess(returnCode)) {
                    Log.d(TAG, "FFmpeg execution succeeded")
                    invoke.resolve(ret)
                } else {
                    Log.e(TAG, "FFmpeg execution failed with rc=${returnCode.value}")
                    Log.e(TAG, "Output: $output")
                    invoke.resolve(ret)
                }
            } catch (e: Exception) {
                Log.e(TAG, "FFmpeg execution error", e)
                invoke.reject("FFmpeg execution error: ${e.message}")
            }
        }
    }

    /**
     * Probe a media file for video dimensions and duration using FFprobe.
     *
     * Expects JSON payload: { "path": "/absolute/path/to/file" }
     * Returns: { "width": 1920, "height": 1080, "duration": 120.5 }
     */
    @Command
    fun getMediaInformation(invoke: Invoke) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val args = invoke.parseArgs(PathArgs::class.java)
                val rawPath = args.path
                if (rawPath.isNullOrEmpty()) {
                    invoke.reject("Path is required")
                    return@launch
                }

                val path = resolvePathForFFmpeg(rawPath)
                Log.d(TAG, "Getting media information for: $path")

                val session = FFprobeKit.getMediaInformation(path)
                val info = session.mediaInformation

                val ret = JSObject()

                if (info != null) {
                    var width = 0
                    var height = 0

                    // Find the first video stream
                    val streams = info.streams
                    if (streams != null) {
                        for (stream in streams) {
                            val streamType = stream.type
                            if (streamType != null && streamType == "video") {
                                width = stream.width?.toInt() ?: 0
                                height = stream.height?.toInt() ?: 0
                                break
                            }
                        }
                    }

                    val duration = info.duration?.toDoubleOrNull() ?: 0.0

                    ret.put("width", width)
                    ret.put("height", height)
                    ret.put("duration", duration)

                    Log.d(TAG, "Media info: ${width}x${height}, duration=${duration}s")
                    invoke.resolve(ret)
                } else {
                    Log.e(TAG, "Failed to get media information for: $path")
                    ret.put("width", 0)
                    ret.put("height", 0)
                    ret.put("duration", 0.0)
                    invoke.resolve(ret)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Media information error", e)
                invoke.reject("Media information error: ${e.message}")
            }
        }
    }

    /**
      * Get the duration of an audio/video file in seconds.
      *
      * Expects JSON payload: { "path": "/absolute/path/to/file" }
      * Returns: { "duration": 120.5 }
      */
    @Command
    fun getDuration(invoke: Invoke) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val args = invoke.parseArgs(PathArgs::class.java)
                val rawPath = args.path
                if (rawPath.isNullOrEmpty()) {
                    invoke.reject("Path is required")
                    return@launch
                }

                val path = resolvePathForFFmpeg(rawPath)
                Log.d(TAG, "Getting duration for: $path")

                val session = FFprobeKit.getMediaInformation(path)
                val info = session.mediaInformation
                val duration = info?.duration?.toDoubleOrNull() ?: 0.0

                val ret = JSObject()
                ret.put("duration", duration)

                Log.d(TAG, "Duration: ${duration}s")
                invoke.resolve(ret)
            } catch (e: Exception) {
                Log.e(TAG, "Duration error", e)
                invoke.reject("Duration error: ${e.message}")
            }
        }
    }

    /**
     * Save a video file to the public gallery (Movies directory) via MediaStore.
     * On API 29+ uses MediaStore API; on older APIs copies to public Movies folder.
     *
     * Expects JSON payload: { "path": "/absolute/path/to/file.mp4" }
     * Returns: { "galleryPath": "content://media/external/video/media/123" }
     */
    @Command
    fun saveToGallery(invoke: Invoke) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val args = invoke.parseArgs(PathArgs::class.java)
                val rawPath = args.path
                if (rawPath.isNullOrEmpty()) {
                    invoke.reject("Path is required")
                    return@launch
                }

                val sourceFile = File(rawPath)
                if (!sourceFile.exists()) {
                    invoke.reject("File not found: $rawPath")
                    return@launch
                }

                val fileName = "quran_${System.currentTimeMillis()}.mp4"
                var galleryUri: Uri? = null

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    val values = ContentValues().apply {
                        put(MediaStore.Video.Media.DISPLAY_NAME, fileName)
                        put(MediaStore.Video.Media.MIME_TYPE, "video/mp4")
                        put(MediaStore.Video.Media.RELATIVE_PATH, Environment.DIRECTORY_MOVIES + "/QuranShort")
                        put(MediaStore.Video.Media.IS_PENDING, 1)
                    }

                    val resolver = activity.contentResolver
                    galleryUri = resolver.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, values)

                    if (galleryUri != null) {
                        resolver.openOutputStream(galleryUri)?.use { out ->
                            FileInputStream(sourceFile).use { inp -> inp.copyTo(out) }
                        }

                        val updateValues = ContentValues().apply {
                            put(MediaStore.Video.Media.IS_PENDING, 0)
                        }
                        resolver.update(galleryUri, updateValues, null, null)

                        Log.d(TAG, "Saved to gallery via MediaStore: $galleryUri")
                    }
                } else {
                    val moviesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES)
                    val quranDir = File(moviesDir, "QuranShort")
                    if (!quranDir.exists()) quranDir.mkdirs()

                    val destFile = File(quranDir, fileName)
                    FileInputStream(sourceFile).use { inp ->
                        destFile.outputStream().use { out -> inp.copyTo(out) }
                    }

                    val intent = Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE)
                    intent.data = Uri.fromFile(destFile)
                    activity.sendBroadcast(intent)

                    galleryUri = Uri.fromFile(destFile)
                    Log.d(TAG, "Saved to gallery (legacy): ${destFile.absolutePath}")
                }

                val ret = JSObject()
                ret.put("galleryPath", galleryUri?.toString() ?: "")
                invoke.resolve(ret)
            } catch (e: Exception) {
                Log.e(TAG, "Save to gallery error", e)
                invoke.reject("Save to gallery error: ${e.message}")
            }
        }
    }

    /**
     * Share a video file using Android's native share sheet (Intent.ACTION_SEND).
     * Uses FileProvider to create a content:// URI for the file.
     *
     * Expects JSON payload: { "path": "/absolute/path/to/file.mp4" }
     * Returns: { "shared": true }
     */
    @Command
    fun shareVideo(invoke: Invoke) {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val args = invoke.parseArgs(PathArgs::class.java)
                val rawPath = args.path
                if (rawPath.isNullOrEmpty()) {
                    invoke.reject("Path is required")
                    return@launch
                }

                val sourceFile = File(rawPath)
                if (!sourceFile.exists()) {
                    invoke.reject("File not found: $rawPath")
                    return@launch
                }

                val contentUri = FileProvider.getUriForFile(
                    activity,
                    "${activity.packageName}.fileprovider",
                    sourceFile
                )

                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                    type = "video/mp4"
                    putExtra(Intent.EXTRA_STREAM, contentUri)
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }

                val chooserIntent = Intent.createChooser(shareIntent, "Share Video")
                chooserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                activity.startActivity(chooserIntent)

                Log.d(TAG, "Share intent launched for: $rawPath")

                val ret = JSObject()
                ret.put("shared", true)
                invoke.resolve(ret)
            } catch (e: Exception) {
                Log.e(TAG, "Share video error", e)
                invoke.reject("Share video error: ${e.message}")
            }
        }
    }
}
