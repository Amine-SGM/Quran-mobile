/**
 * Stub implementation of PLATFORM_hid_write (and related hidapi symbols)
 * referenced by libavdevice.so in ffmpeg-kit "full" builds.
 *
 * The "full" variant compiles FFmpeg's libavdevice with HID input device
 * support (for webcam/capture devices). This pulls in hidapi, which uses a
 * platform-specific PLATFORM_* naming for its implementations. On Android
 * that platform implementation is absent, causing dlopen to fail.
 *
 * We don't need HID device capture — we only need transcoding/muxing.
 * This stub solely exists to satisfy the dynamic linker requirement.
 * All functions return error (-1 / NULL) so they are never actually used.
 */

#include <stddef.h>
#include <stdint.h>

/* ── Primary symbol that crashes the app ──────────────────────────────────── */

int PLATFORM_hid_write(void *device, const unsigned char *data, size_t length) {
    return -1;
}

/* ── Guard against future symbols in the same family ─────────────────────── */

int PLATFORM_hid_read(void *device, unsigned char *data, size_t length) {
    return -1;
}

int PLATFORM_hid_read_timeout(void *device, unsigned char *data,
                              size_t length, int milliseconds) {
    return -1;
}

int PLATFORM_hid_send_feature_report(void *device,
                                     const unsigned char *data, size_t length) {
    return -1;
}

int PLATFORM_hid_get_feature_report(void *device,
                                    unsigned char *data, size_t length) {
    return -1;
}

void PLATFORM_hid_close(void *device) {}

int PLATFORM_hid_set_nonblocking(void *device, int nonblock) {
    return -1;
}
