use anyhow::Error;
use std::{fs, fs::File, io::Write, path::Path};

pub fn setup_logging(config_file: &Path, base_path: &Path, default: &str) -> Result<String, Error> {
    println!(
        "Initializing logging according to {:?}",
        config_file.to_str().unwrap_or("[??]")
    );

    if !config_file.exists() {
        if let Some(d) = config_file.parent() {
            fs::create_dir_all(d).map_err(|e| {
                Error::msg(format!(
                    "Could not create parent directory for log file: {:?}",
                    e
                ))
            })?;
        };
    }

    let contents = default.to_string();

    let replace_str = base_path
        .to_str()
        .expect("Could not replace {{log_dir}} variable from the log4rs config")
        // log4rs requires the path to be in a unix format regardless of the system it's running on
        .replace('\\', "/");

    let contents = contents.replace("{{log_dir}}", &replace_str);
    let mut file = File::create(config_file)
        .map_err(|e| Error::msg(format!("Could not create default log file: {}", e)))?;

    file.write_all(contents.as_bytes())
        .map_err(|e| Error::msg(format!("Could not write to file: {}", e)))?;
    Ok(contents)
}
