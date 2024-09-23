use std::path::{Component, Path, PathBuf};

/// Returns a relative path from one path to another.
pub fn make_relative_path(root: &Path, current: &Path) -> PathBuf {
    let mut result = PathBuf::new();
    let root_components = root.components().collect::<Vec<Component>>();
    let current_components = current.components().collect::<Vec<_>>();
    for i in 0..current_components.len() {
        let current_path_component: Component = current_components[i];
        if i < root_components.len() {
            let other: Component = root_components[i];
            if other != current_path_component {
                break;
            }
        } else {
            result.push(current_path_component)
        }
    }
    result
}

// Returns a String representing the given Path.
pub fn path_as_string(path: &Path) -> String {
    let mut path_str = String::new();
    for component in path.components() {
        if let Component::Normal(os_str) = component {
            if !path_str.is_empty() {
                path_str.push('/');
            }
            path_str.push_str(&os_str.to_string_lossy());
        }
    }
    path_str
}
