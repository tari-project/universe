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

use std::path::PathBuf;

pub enum BinaryPlatformAssets {
    LinuxX64,
    WindowsX64,
    MacOSX64,
    MacOSArm64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Binaries {
    Xmrig,
    MergeMiningProxy,
    MinotariNode,
    Wallet,
    ShaP2pool,
    GpuMiner,
    Tor,
    BridgeTapplet,
}

impl Binaries {
    pub fn name(&self) -> &str {
        match self {
            Binaries::Xmrig => "xmrig",
            Binaries::MergeMiningProxy => "mmproxy",
            Binaries::MinotariNode => "minotari_node",
            Binaries::Wallet => "wallet",
            Binaries::ShaP2pool => "sha-p2pool",
            Binaries::GpuMiner => "glytex",
            Binaries::Tor => "tor",
            Binaries::BridgeTapplet => "bridge",
        }
    }

    pub fn from_name(name: &str) -> Self {
        match name {
            "xmrig" => Binaries::Xmrig,
            "mmproxy" => Binaries::MergeMiningProxy,
            "minotari_node" => Binaries::MinotariNode,
            "wallet" => Binaries::Wallet,
            "sha-p2pool" => Binaries::ShaP2pool,
            "glytex" => Binaries::GpuMiner,
            "tor" => Binaries::Tor,
            "bridge" => Binaries::BridgeTapplet,
            _ => panic!("Unknown binary name: {name}"),
        }
    }

    pub fn binary_file_name(self, version: String) -> PathBuf {
        match self {
            Binaries::Xmrig => {
                let file_name = format!("xmrig-{version}");
                PathBuf::from(file_name).join("xmrig")
            }
            Binaries::MergeMiningProxy => {
                let file_name = "minotari_merge_mining_proxy";
                PathBuf::from(file_name)
            }
            Binaries::MinotariNode => {
                let file_name = "minotari_node";
                PathBuf::from(file_name)
            }
            Binaries::Wallet => {
                let file_name = "minotari_console_wallet";
                PathBuf::from(file_name)
            }
            Binaries::ShaP2pool => {
                let file_name = "sha_p2pool";
                PathBuf::from(file_name)
            }
            Binaries::GpuMiner => {
                let file_name = "glytex";
                PathBuf::from(file_name)
            }
            Binaries::Tor => {
                let file_name = "tor";
                PathBuf::from(file_name)
            }
            Binaries::BridgeTapplet => {
                let file_name = format!("bridge-{version}");
                PathBuf::from(file_name).join("bridge")
            }
        }
    }

    #[allow(clippy::too_many_lines)]
    pub fn get_binary_platform_name(
        self,
        platform: BinaryPlatformAssets,
        version: String,
        network: String,
        hash: String,
    ) -> String {
        match self {
            Binaries::BridgeTapplet => format!("bridge-v{version}.zip"),
            Binaries::GpuMiner => match platform {
                BinaryPlatformAssets::LinuxX64 => {
                    format!("glytex-opencl-linux-x86_64-{network}-{version}-{hash}.zip")
                }
                BinaryPlatformAssets::WindowsX64 => {
                    format!("glytex-opencl-windows-x64-{network}-{version}-{hash}.zip")
                }
                BinaryPlatformAssets::MacOSX64 => {
                    format!("glytex-opencl-macos-x86_64-{network}-{version}-{hash}.zip")
                }
                BinaryPlatformAssets::MacOSArm64 => {
                    format!("glytex-combined-macos-arm64-{network}-{version}-{hash}.zip")
                }
            },
            Binaries::ShaP2pool => match platform {
                BinaryPlatformAssets::LinuxX64 => {
                    format!("sha_p2pool-{version}-{hash}-linux-x86_64.zip")
                }
                BinaryPlatformAssets::WindowsX64 => {
                    format!("sha_p2pool-{version}-{hash}-windows-x64.exe.zip")
                }
                BinaryPlatformAssets::MacOSX64 => {
                    format!("sha_p2pool-{version}-{hash}-macos-x86_64.zip")
                }
                BinaryPlatformAssets::MacOSArm64 => {
                    format!("sha_p2pool-{version}-{hash}-macos-arm64.zip")
                }
            },
            Binaries::Xmrig => match platform {
                BinaryPlatformAssets::LinuxX64 => {
                    format!("xmrig-{version}-linux-static-x64.tar.gz")
                }
                BinaryPlatformAssets::WindowsX64 => {
                    format!("xmrig-{version}-msvc-win64.zip")
                }
                BinaryPlatformAssets::MacOSX64 => {
                    format!("xmrig-{version}-macos-x64.tar.gz")
                }
                BinaryPlatformAssets::MacOSArm64 => {
                    format!("xmrig-{version}-macos-arm64.tar.gz")
                }
            },
            Binaries::Tor => match platform {
                BinaryPlatformAssets::LinuxX64 => {
                    format!("tor-expert-bundle-linux-x86_64-{version}.tar.gz")
                }
                BinaryPlatformAssets::WindowsX64 => {
                    format!("tor-expert-bundle-windows-x86_64-{version}.tar.gz")
                }
                BinaryPlatformAssets::MacOSX64 => {
                    format!("tor-expert-bundle-macos-x86_64-{version}.tar.gz")
                }
                BinaryPlatformAssets::MacOSArm64 => {
                    format!("tor-expert-bundle-macos-aarch64-{version}.tar.gz")
                }
            },
            Binaries::MergeMiningProxy => match platform {
                BinaryPlatformAssets::LinuxX64 => {
                    format!("tari_suite-{version}-{hash}-linux-x86_64.zip")
                }
                BinaryPlatformAssets::WindowsX64 => {
                    format!("tari_suite-{version}-{hash}-windows-x64.exe.zip")
                }
                BinaryPlatformAssets::MacOSX64 => {
                    format!("tari_suite-{version}-{hash}-macos-x86_64.zip")
                }
                BinaryPlatformAssets::MacOSArm64 => {
                    format!("tari_suite-{version}-{hash}-macos-arm64.zip")
                }
            },
            Binaries::MinotariNode => match platform {
                BinaryPlatformAssets::LinuxX64 => {
                    format!("tari_suite-{version}-{hash}-linux-x86_64.zip")
                }
                BinaryPlatformAssets::WindowsX64 => {
                    format!("tari_suite-{version}-{hash}-windows-x64.exe.zip")
                }
                BinaryPlatformAssets::MacOSX64 => {
                    format!("tari_suite-{version}-{hash}-macos-x86_64.zip")
                }
                BinaryPlatformAssets::MacOSArm64 => {
                    format!("tari_suite-{version}-{hash}-macos-arm64.zip")
                }
            },
            Binaries::Wallet => match platform {
                BinaryPlatformAssets::LinuxX64 => {
                    format!("tari_suite-{version}-{hash}-linux-x86_64.zip")
                }
                BinaryPlatformAssets::WindowsX64 => {
                    format!("tari_suite-{version}-{hash}-windows-x64.exe.zip")
                }
                BinaryPlatformAssets::MacOSX64 => {
                    format!("tari_suite-{version}-{hash}-macos-x86_64.zip")
                }
                BinaryPlatformAssets::MacOSArm64 => {
                    format!("tari_suite-{version}-{hash}-macos-arm64.zip")
                }
            },
        }
    }
}
