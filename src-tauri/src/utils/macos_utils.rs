#[cfg(target_os = "macos")]
use std::env;
#[cfg(target_os = "macos")]
use std::path::Path;

#[cfg(target_os = "macos")]
pub fn is_app_in_applications_folder() -> bool {
    let current_exe = env::current_exe().unwrap();
    let applications_folder = Path::new("/Applications");
    current_exe.starts_with(applications_folder)
}
