fn main() {
    let out_dir = std::env::var("OUT_DIR").unwrap();
    let dest_path = std::path::Path::new(&out_dir).join("surah_data.rs");
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
    let surahs_dir = std::path::Path::new(&manifest_dir)
        .parent()
        .unwrap()
        .join("public")
        .join("surahs");

    let mut code = String::from("#[cfg(target_os = \"android\")]\nfn get_surah_png_bytes(n: u32) -> Option<&'static [u8]> {\n    match n {\n");

    for i in 1..=114 {
        let path = surahs_dir.join(format!("{:03}.png", i));
        if !path.exists() {
            panic!("Surah PNG not found: {}", path.display());
        }
        let abs_path = std::fs::canonicalize(&path).unwrap();
        let path_str = abs_path
            .to_string_lossy()
            .trim_start_matches("\\\\?\\")
            .trim_start_matches("//?/")
            .replace('\\', "/");
        code.push_str(&format!(
            "        {} => Some(include_bytes!(\"{}\")),\n",
            i, path_str
        ));
    }

    code.push_str("        _ => None,\n    }\n}\n");

    std::fs::write(&dest_path, &code).unwrap();

    tauri_build::build()
}
