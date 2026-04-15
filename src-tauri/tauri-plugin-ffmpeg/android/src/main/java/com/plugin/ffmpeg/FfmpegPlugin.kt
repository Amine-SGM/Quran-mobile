package com.plugin.ffmpeg

import android.app.Activity
import android.util.Log
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import com.arthenica.ffmpegkit.FFmpegKit
import com.arthenica.ffmpegkit.FFprobeKit
import com.arthenica.ffmpegkit.ReturnCode
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

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

        init {
            // libavdevice.so (bundled in ffmpeg-kit "full" builds) references
            // PLATFORM_hid_write at load time for its HID input device support.
            // That symbol is absent on Android, causing an UnsatisfiedLinkError
            // before any FFmpeg call is made.
            //
            // Solution: preload our stub library here so the symbol is already
            // present in the process's dynamic symbol table when FFmpegKitConfig's
            // static initializer eventually loads libffmpegkit.so → libavdevice.so.
            try {
                System.loadLibrary("hidapi_stub")
                Log.d(TAG, "hidapi_stub preloaded successfully")
            } catch (e: UnsatisfiedLinkError) {
                Log.w(TAG, "hidapi_stub preload skipped: ${e.message}")
            }
        }
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
                val command = args.args.joinToString(" ") { arg ->
                    // Quote arguments that contain spaces or special characters
                    if (arg.contains(" ") || arg.contains("'") || arg.contains(";") || arg.contains("[") || arg.contains("(")) {
                        "'" + arg.replace("'", "'\\''") + "'"
                    } else {
                        arg
                    }
                }

                Log.d(TAG, "Executing FFmpeg command: $command")

                val session = FFmpegKit.execute(command)
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
                val path = args.path
                if (path.isNullOrEmpty()) {
                    invoke.reject("Path is required")
                    return@launch
                }

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
                val path = args.path
                if (path.isNullOrEmpty()) {
                    invoke.reject("Path is required")
                    return@launch
                }

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
}
