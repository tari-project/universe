pub async fn download_file(url: &str, destination: &Path) -> Result<(), anyhow::Error> {
    println!("Downloading {} to {:?}", url, destination);
    let response = reqwest::get(url).await?;

    // Ensure the directory exists
    if let Some(parent) = destination.parent() {
        println!("Creating dir {:?}", parent);
        fs::create_dir_all(parent).await?;
    }

    // Open a file for writing
    let mut dest = File::create(destination).await?;

    // Stream the response body directly to the file
    let mut stream = response.bytes_stream();
    while let Some(item) = stream.next().await {
        println!("Writing bytes");
        dest.write_all(&item?).await?;
    }
    println!("Done downloading");

    Ok(())
}

pub async fn extract(file_path: &Path, dest_dir: &Path) -> Result<(), anyhow::Error> {
    match file_path.extension() {
        Some(ext) => match ext.to_str() {
            Some("gz") => {
                extract_gz(file_path, dest_dir).await?;
            }
            Some("zip") => {
                extract_zip(file_path, dest_dir).await?;
            }
            _ => {
                return Err(anyhow::anyhow!("Unsupported file extension"));
            }
        },
        None => {
            return Err(anyhow::anyhow!("File has no extension"));
        }
    }
    Ok(())
}

pub async fn extract_gz(gz_path: &Path, dest_dir: &Path) -> std::io::Result<()> {
    let gz_file = std::fs::File::open(gz_path)?;
    println!("Extracting file at {:?}", gz_path);
    let decoder = GzDecoder::new(std::io::BufReader::new(gz_file));
    let mut archive = Archive::new(decoder);
    println!("Unpacking to {:?}", dest_dir);
    archive.unpack(dest_dir)?;
    Ok(())
}

use anyhow::anyhow;
use async_zip::base::read::seek::ZipFileReader;
use flate2::read::GzDecoder;
use futures_util::StreamExt;
use std::path::{Path, PathBuf};
use tar::Archive;
use tokio::fs;
use tokio::fs::{File, OpenOptions};
use tokio::io::{AsyncWriteExt, BufReader};
use tokio_util::compat::{TokioAsyncReadCompatExt, TokioAsyncWriteCompatExt};

// Taken from async_zip example

fn sanitize_file_path(path: &str) -> PathBuf {
    // Replaces backwards slashes
    path.replace('\\', "/")
        // Sanitizes each component
        .split('/')
        .map(sanitize_filename::sanitize)
        .collect()
}
pub async fn extract_zip(archive: &Path, out_dir: &Path) -> Result<(), anyhow::Error> {
    let archive = BufReader::new(fs::File::open(archive).await?).compat();
    let mut reader = ZipFileReader::new(archive).await?;
    for index in 0..reader.file().entries().len() {
        let entry = reader.file().entries().get(index).unwrap();
        let path = out_dir.join(sanitize_file_path(entry.filename().as_str().unwrap()));
        // If the filename of the entry ends with '/', it is treated as a directory.
        // This is implemented by previous versions of this crate and the Python Standard Library.
        // https://docs.rs/async_zip/0.0.8/src/async_zip/read/mod.rs.html#63-65
        // https://github.com/python/cpython/blob/820ef62833bd2d84a141adedd9a05998595d6b6d/Lib/zipfile.py#L528
        let entry_is_dir = entry.dir().unwrap();

        let mut entry_reader = reader.reader_without_entry(index).await?;

        if entry_is_dir {
            // The directory may have been created if iteration is out of order.
            if !path.exists() {
                fs::create_dir_all(&path).await?;
            }
        } else {
            // Creates parent directories. They may not exist if iteration is out of order
            // or the archive does not contain directory entries.
            let parent = path.parent().ok_or_else(|| anyhow!("no parent"))?;
            if !parent.is_dir() {
                fs::create_dir_all(parent).await?;
            }
            let writer = OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&path)
                .await?;
            futures_lite::io::copy(&mut entry_reader, &mut writer.compat_write()).await?;

            // Closes the file and manipulates its metadata here if you wish to preserve its metadata from the archive.
        }
    }
    Ok(())
}

pub async fn set_permissions(file_path: &Path) -> Result<(), anyhow::Error> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = fs::metadata(file_path).await?.permissions();
        let current_mode = perms.mode();
        perms.set_mode(current_mode | 0o111);
        fs::set_permissions(file_path, perms).await?;
    }
    Ok(())
}
