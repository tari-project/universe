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

use serde::{Deserialize, Serialize};

pub mod lolminer;

/// lolMiner mines Cuckaroo29 (Tari) on Nvidia GTX 1000 and newer, and AMD RX 400 and newer,
/// with at least 6 GB of GPU memory.
/// See <https://github.com/Lolliedieb/lolMiner-releases/releases/tag/1.98>
pub const MIN_GPU_MEMORY_MB_FOR_C29: u64 = 6144;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct GpuCommonInformation {
    pub name: String,
    pub device_id: u32,
    pub vendor: String,
    /// Memory reported by the miner, in MB. `None` when it could not be determined.
    pub memory_mb: Option<u64>,
}

impl GpuCommonInformation {
    /// Whether this device has enough memory to mine C29.
    ///
    /// A device whose memory could not be determined is treated as eligible, so a gap in
    /// parsing never silently disables a rig that was previously mining.
    ///
    /// Integrated GPUs report shared system memory here, so this is necessary but not
    /// sufficient for a device to actually mine.
    pub fn has_enough_memory_for_c29(&self) -> bool {
        self.memory_mb
            .is_none_or(|mb| mb >= MIN_GPU_MEMORY_MB_FOR_C29)
    }
}
