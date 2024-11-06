pub enum CurrentOperatingSystem {
    Windows,
    Linux,
    MacOS,
}

pub struct PlatformUtils {}
impl PlatformUtils {
    pub fn detect_current_os() -> CurrentOperatingSystem {
        if cfg!(target_os = "windows") {
            CurrentOperatingSystem::Windows
        } else if cfg!(target_os = "linux") {
            CurrentOperatingSystem::Linux
        } else if cfg!(target_os = "macos") {
            CurrentOperatingSystem::MacOS
        } else {
            panic!("Unsupported OS");
        }
    }
}
