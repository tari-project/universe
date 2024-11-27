#[cfg(target_os = "macos")]
use std::env;
#[cfg(target_os = "macos")]
use std::fs;
#[cfg(target_os = "macos")]
use std::path::Path;
#[cfg(target_os = "macos")]
use tauri::api::dialog;

#[cfg(target_os = "macos")]
fn prompt_user_to_move_app(window: tauri::Window) {
    let message = "The app is not located in the Applications folder. Would you like to move it there?";
    let title = "Move app to Applications folder";
    let result = dialog::ask(Some(&window), title, message, |answer| {
        if answer {
            move_app_to_applications_folder();
        }
    });
}

#[cfg(target_os = "macos")]
fn is_app_in_applications_folder() -> bool {
    let current_exe = env::current_exe().unwrap();
    let applications_folder = Path::new("/Applications");
    current_exe.starts_with(applications_folder)
}

#[cfg(target_os = "macos")]
fn move_app_to_applications_folder() {
    let current_exe = env::current_exe().unwrap();
    let applications_folder = Path::new("/Applications");
    let new_path = applications_folder.join(current_exe.file_name().unwrap());
    fs::copy(&current_exe, &new_path).unwrap();
    fs::remove_file(current_exe).unwrap();
}

#[cfg(target_os = "macos")]
pub fn check_if_app_in_applications_folder(window: tauri::Window) {
    if !is_app_in_applications_folder() {
        prompt_user_to_move_app(window);
    }
}
