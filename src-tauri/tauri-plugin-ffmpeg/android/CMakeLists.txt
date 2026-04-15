cmake_minimum_required(VERSION 3.22.1)
project("hidapi_stub")

# Builds a tiny shared library that exports PLATFORM_hid_write and related
# hidapi symbols.  libavdevice.so (from ffmpeg-kit "full" builds) references
# these symbols at load time for its HID input device support.  Since we only
# need transcoding / muxing we don't need real HID functionality — the stub
# satisfies the dynamic linker so the app no longer crashes on startup.
add_library(hidapi_stub SHARED src/main/cpp/hidapi_stub.c)

target_link_libraries(hidapi_stub log)
