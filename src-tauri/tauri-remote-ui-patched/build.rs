// MIT License
// Copyright (c) 2025 DraviaVemal
// See LICENSE file in the root directory.

const COMMANDS: &[&str] = &[];

/// Entry point for the build script.
fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
