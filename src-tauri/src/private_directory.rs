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

use std::{
    fs::File,
    io,
    path::{Path, PathBuf},
};

pub fn validate_https_source(url: &str) -> io::Result<()> {
    if !url.starts_with("https://") {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "Installer downloads require an HTTPS source",
        ));
    }
    Ok(())
}

pub fn create_new_file(path: &Path) -> io::Result<File> {
    File::options().write(true).create_new(true).open(path)
}

pub struct PrivateDirectory(PathBuf);

impl PrivateDirectory {
    pub fn path(&self) -> &Path {
        &self.0
    }
}

impl Drop for PrivateDirectory {
    fn drop(&mut self) {
        drop(std::fs::remove_dir_all(&self.0));
    }
}

pub fn create_private_dir(parent: &Path) -> io::Result<PrivateDirectory> {
    #[cfg(unix)]
    {
        let directory = tempfile::Builder::new()
            .prefix("universe-")
            .tempdir_in(parent)?;
        restrict_directory(directory.path())?;
        Ok(PrivateDirectory(directory.keep()))
    }
    #[cfg(windows)]
    {
        use std::sync::atomic::{AtomicU64, Ordering};
        static ATTEMPT: AtomicU64 = AtomicU64::new(0);
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(io::Error::other)?
            .as_nanos();
        for _ in 0..100 {
            let path = parent.join(format!(
                "universe-{}-{timestamp}-{}",
                std::process::id(),
                ATTEMPT.fetch_add(1, Ordering::Relaxed)
            ));
            match windows_acl::create_directory(&path) {
                Ok(()) => return Ok(PrivateDirectory(path)),
                Err(error) if error.kind() == io::ErrorKind::AlreadyExists => continue,
                Err(error) => return Err(error),
            }
        }
        Err(io::Error::new(
            io::ErrorKind::AlreadyExists,
            "Cannot create a fresh private staging directory",
        ))
    }
}

pub fn restrict_directory(path: &Path) -> io::Result<()> {
    if !std::fs::symlink_metadata(path)?.is_dir() {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "Private directory must not be a symlink or file",
        ));
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o700))
    }
    #[cfg(windows)]
    windows_acl::restrict(path)
}

#[cfg(windows)]
mod windows_acl {
    use std::{ffi::c_void, io, mem::size_of, os::windows::ffi::OsStrExt, path::Path, ptr};
    use windows_sys::Win32::{
        Foundation::{CloseHandle, LocalFree},
        Security::{
            Authorization::{
                ConvertSidToStringSidW, ConvertStringSecurityDescriptorToSecurityDescriptorW,
            },
            DACL_SECURITY_INFORMATION, GetTokenInformation, PROTECTED_DACL_SECURITY_INFORMATION,
            SECURITY_ATTRIBUTES, SetFileSecurityW, TOKEN_QUERY, TOKEN_USER, TokenUser,
        },
        Storage::FileSystem::CreateDirectoryW,
        System::Threading::{GetCurrentProcess, OpenProcessToken},
    };

    struct LocalAllocation(*mut c_void);
    impl Drop for LocalAllocation {
        fn drop(&mut self) {
            unsafe {
                LocalFree(self.0 as _);
            }
        }
    }

    fn descriptor() -> io::Result<LocalAllocation> {
        unsafe {
            let mut token = std::mem::zeroed();
            if OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut token) == 0 {
                return Err(io::Error::last_os_error());
            }
            let mut length = 0;
            GetTokenInformation(token, TokenUser, ptr::null_mut(), 0, &mut length);
            // A usize buffer keeps TOKEN_USER aligned, unlike a byte vector.
            let mut buffer = vec![0usize; (length as usize).div_ceil(size_of::<usize>())];
            let result = GetTokenInformation(
                token,
                TokenUser,
                buffer.as_mut_ptr().cast(),
                length,
                &mut length,
            );
            let error = io::Error::last_os_error();
            CloseHandle(token);
            if result == 0 {
                return Err(error);
            }
            let user = &*buffer.as_ptr().cast::<TOKEN_USER>();
            let mut sid = ptr::null_mut();
            if ConvertSidToStringSidW(user.User.Sid, &mut sid) == 0 {
                return Err(io::Error::last_os_error());
            }
            let sid_allocation = LocalAllocation(sid.cast());
            let mut sid_len = 0;
            while *sid.add(sid_len) != 0 {
                sid_len += 1;
            }
            let sid_text = String::from_utf16_lossy(std::slice::from_raw_parts(sid, sid_len));
            drop(sid_allocation);
            // Protected DACL: only this user, inherited by new files and directories.
            let sddl: Vec<u16> = format!("D:P(A;OICI;FA;;;{sid_text})")
                .encode_utf16()
                .chain(Some(0))
                .collect();
            let mut descriptor = ptr::null_mut();
            if ConvertStringSecurityDescriptorToSecurityDescriptorW(
                sddl.as_ptr(),
                1,
                &mut descriptor,
                ptr::null_mut(),
            ) == 0
            {
                return Err(io::Error::last_os_error());
            }
            Ok(LocalAllocation(descriptor))
        }
    }

    pub fn create_directory(path: &Path) -> io::Result<()> {
        let descriptor = descriptor()?;
        let attributes = SECURITY_ATTRIBUTES {
            nLength: u32::try_from(size_of::<SECURITY_ATTRIBUTES>())
                .expect("SECURITY_ATTRIBUTES fits u32"),
            lpSecurityDescriptor: descriptor.0,
            bInheritHandle: 0,
        };
        let path: Vec<u16> = path.as_os_str().encode_wide().chain(Some(0)).collect();
        if unsafe { CreateDirectoryW(path.as_ptr(), &attributes) } == 0 {
            return Err(io::Error::last_os_error());
        }
        Ok(())
    }

    pub fn restrict(path: &Path) -> io::Result<()> {
        let descriptor = descriptor()?;
        let path: Vec<u16> = path.as_os_str().encode_wide().chain(Some(0)).collect();
        if unsafe {
            SetFileSecurityW(
                path.as_ptr(),
                DACL_SECURITY_INFORMATION | PROTECTED_DACL_SECURITY_INFORMATION,
                descriptor.0,
            )
        } == 0
        {
            return Err(io::Error::last_os_error());
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_private_staging_distinct_attempts_are_new_directories() {
        let root = tempfile::tempdir().expect("fixture operation succeeds");
        let first = create_private_dir(root.path()).expect("fixture operation succeeds");
        let second = create_private_dir(root.path()).expect("fixture operation succeeds");
        assert_ne!(first.path(), second.path());
    }
    #[cfg(unix)]
    #[test]
    fn test_private_staging_permissions_exclude_other_users() {
        use std::os::unix::fs::PermissionsExt;
        let root = tempfile::tempdir().expect("fixture operation succeeds");
        let staging = create_private_dir(root.path()).expect("fixture operation succeeds");
        assert_eq!(
            std::fs::metadata(staging.path())
                .expect("fixture operation succeeds")
                .permissions()
                .mode()
                & 0o777,
            0o700
        );
    }
    #[test]
    fn test_installer_source_non_https_rejected() {
        assert!(validate_https_source("http://vendor.invalid/installer.exe").is_err());
        assert!(validate_https_source("https://vendor.invalid/installer.exe").is_ok());
    }
    #[test]
    fn test_installer_pre_existing_file_is_never_opened_or_overwritten() {
        let root = tempfile::tempdir().expect("fixture operation succeeds");
        let planted = root.path().join("installer.exe");
        std::fs::write(&planted, b"planted").expect("fixture operation succeeds");
        assert!(create_new_file(&planted).is_err());
        assert_eq!(
            std::fs::read(planted).expect("fixture operation succeeds"),
            b"planted"
        );
    }
}
