// Copyright 2025. The Tari Project
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

mod cache;
pub mod clients;
pub mod utils;

// https://github.com/tari-project/glytex/releases/download/v0.2.29/glytex-opencl-linux-x86_64-testnet-0.2.29-fd0dd7f.zip
pub fn get_gh_download_url(repo_owner: &str, repo_name: &str) -> String {
    format!("https://github.com/{repo_owner}/{repo_name}/releases/download")
}
// https://cdn-universe.tari.com/tari-project/glytex/releases/download/v0.2.29/glytex-opencl-linux-x86_64-testnet-0.2.29-fd0dd7f.zip
// https://dist.torproject.org/torbrowser/15.0.5/tor-expert-bundle-linux-x86_64-15.0.5.tar.gz
// https://cdn-universe.tari.com/tari-project/glytex/releases/download/v0.2.29/glytex-opencl-linux-x86_64-testnet-0.2.29-fd0dd7f.zip.sha256
pub fn get_mirror_download_url(repo_owner: &str, repo_name: &str) -> String {
    format!("https://cdn-universe.tari.com/{repo_owner}/{repo_name}/releases/download")
}
