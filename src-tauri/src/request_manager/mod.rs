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

use log::warn;

pub mod request_client;

const LOG_TARGET: &str = "tari::universe::request_manager_utils";

// https://github.com/tari-project/glytex/releases/download/v0.2.29/glytex-opencl-linux-x86_64-testnet-0.2.29-fd0dd7f.zip
pub fn get_gh_download_url(repo_owner: &str, repo_name: &str) -> String {
    format!("https://github.com/{repo_owner}/{repo_name}/releases/download")
}
// https://cdn-universe.tari.com/tari-project/glytex/releases/download/v0.2.29/glytex-opencl-linux-x86_64-testnet-0.2.29-fd0dd7f.zip
// https://dist.torproject.org/torbrowser/14.5.1/tor-expert-bundle-linux-x86_64-14.5.1.tar.gz
// https://cdn-universe.tari.com/tari-project/glytex/releases/download/v0.2.29/glytex-opencl-linux-x86_64-testnet-0.2.29-fd0dd7f.zip.sha256
pub fn get_mirror_download_url(repo_owner: &str, repo_name: &str) -> String {
    format!("https://cdn-universe.tari.com/{repo_owner}/{repo_name}/releases/download")
}

#[allow(dead_code)]
pub enum CloudFlareCacheStatus {
    Hit,
    Miss,
    Unknown,
    Expired,
    Stale,
    Bypass,
    Revalidated,
    Updating,
    Dynamic,
    NonExistent,
}

#[allow(dead_code)]
impl CloudFlareCacheStatus {
    pub fn from_str(s: &str) -> Self {
        match s {
            "HIT" => Self::Hit,
            "MISS" => Self::Miss,
            "EXPIRED" => Self::Expired,
            "STALE" => Self::Stale,
            "BYPASS" => Self::Bypass,
            "REVALIDATED" => Self::Revalidated,
            "UPDATING" => Self::Updating,
            "DYNAMIC" => Self::Dynamic,
            "UNKNOWN" => Self::Unknown,
            "NONE" => Self::Unknown,
            "NONE/UNKNOWN" => Self::Unknown,
            "" => Self::NonExistent,
            _ => Self::Unknown,
        }
    }
    pub fn to_str(&self) -> &str {
        match self {
            Self::Hit => "HIT",
            Self::Miss => "MISS",
            Self::Unknown => "UNKNOWN",
            Self::Expired => "EXPIRED",
            Self::Stale => "STALE",
            Self::Bypass => "BYPASS",
            Self::Revalidated => "REVALIDATED",
            Self::Updating => "UPDATING",
            Self::Dynamic => "DYNAMIC",
            Self::NonExistent => "NONEXISTENT",
        }
    }

    #[allow(dead_code)]
    pub fn is_non_existent(&self) -> bool {
        matches!(self, Self::NonExistent)
    }

    #[allow(dead_code)]
    pub fn is_hit(&self) -> bool {
        matches!(self, Self::Hit) || matches!(self, Self::Revalidated)
    }

    #[allow(dead_code)]
    pub fn is_miss(&self) -> bool {
        matches!(self, Self::Miss)
    }

    #[allow(dead_code)]
    pub fn should_log_warning(&self) -> bool {
        matches!(self, Self::Unknown)
            || matches!(self, Self::NonExistent)
            || matches!(self, Self::Dynamic)
            || matches!(self, Self::Bypass)
    }

    #[allow(dead_code)]
    pub fn log_warning_if_present(&self) {
        if self.should_log_warning() {
            warn!(target: LOG_TARGET, "Cloudflare cache status: {}", self.to_str());
        }
    }
}
