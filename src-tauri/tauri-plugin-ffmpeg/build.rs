fn main() {
    // Tell rustc that `mobile` is a valid cfg flag (set by Tauri at build time)
    println!("cargo::rustc-check-cfg=cfg(mobile)");
}
