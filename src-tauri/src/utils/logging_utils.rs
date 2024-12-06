// Copyright 2024. The Tari Project
//
// Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
// following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
// disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
// following disclaimer in the documentation and/or other materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote
// products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
// INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
// USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

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
