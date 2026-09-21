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

//! Scrubs OS usernames out of absolute paths found in log files.
//!
//! Log bundles uploaded through the support flow (or pasted into public issues)
//! routinely contain home-directory paths such as
//! `C:\\Users\\alice\\AppData\\Local\\com.tari.universe\\...`, which identify the
//! reporter. This module rewrites only the username segment of a well-known
//! home-directory root, leaving the rest of the path intact so it stays useful
//! for debugging.
//!
//! The current user's home directory is deliberately *not* consulted: logs may
//! come from another machine or another user, so matching is purely structural.
//!
//! Behaviours chosen for ambiguous input:
//! * Windows roots match any drive letter, `\`, `\\` (escaped/Debug output) or
//!   `/` separators, and a case-insensitive `users` segment.
//! * Unix roots are matched case-sensitively (`/Users/` on macOS, `/home/` on
//!   Linux) so that lowercase URL paths like `/users/123` are left alone.
//! * Anything that looks like a URL (`scheme://...`) is skipped entirely, so
//!   `https://example.com/home/alice` is not rewritten.
//! * Plain prose containing the word `users` is never touched: a home-directory
//!   root is required.
//! * Scrubbing is idempotent - an already scrubbed `<user>` segment is left as
//!   is, and a string with nothing to scrub is returned borrowed.

use std::borrow::Cow;
use std::sync::LazyLock;

use regex::bytes::Regex;

/// Replacement for the username segment of a home-directory path.
const PLACEHOLDER: &[u8] = b"<user>";

/// Matches either a URL (captured only so it can be skipped) or a
/// home-directory root followed by the username segment.
///
/// `(?x-u)`: verbose mode, ASCII (non-Unicode) semantics so the same pattern
/// can run over log bytes that are not valid UTF-8.
static HOME_PATH_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(
        r#"(?x-u)
        # A URL is matched first so its path cannot be mistaken for a home dir.
        (?P<url>
            [a-zA-Z][a-zA-Z0-9+.\-]* :// [^\s"'<>\\,;()\[\]{}]*
        )
        |
        (?P<prefix>
              [A-Za-z] : (?: \\{1,2} | / ) (?i:users) (?: \\{1,2} | / )   # C:\Users\  C:\\Users\\  D:/Users/
            | /Users/                                                    # macOS
            | /home/                                                     # Linux
        )
        (?P<user> [^\\/\s"']+ )
        "#,
    )
    .expect("log path scrub regex is valid")
});

/// Rewrites every username segment found in `input`, returning `None` when
/// there was nothing to change.
fn scrub_inner(input: &[u8]) -> Option<Vec<u8>> {
    let mut out: Option<Vec<u8>> = None;
    let mut copied_up_to = 0usize;

    for caps in HOME_PATH_RE.captures_iter(input) {
        // The URL alternative has no `user` group; skip those matches whole.
        let Some(user) = caps.name("user") else {
            continue;
        };
        // Already scrubbed - leave it alone so the operation is idempotent.
        if user.as_bytes() == PLACEHOLDER {
            continue;
        }

        let buffer = out.get_or_insert_with(|| Vec::with_capacity(input.len()));
        buffer.extend_from_slice(&input[copied_up_to..user.start()]);
        buffer.extend_from_slice(PLACEHOLDER);
        copied_up_to = user.end();
    }

    out.map(|mut buffer| {
        buffer.extend_from_slice(&input[copied_up_to..]);
        buffer
    })
}

/// Replaces the username in any home-directory path with `<user>`.
///
/// Returns [`Cow::Borrowed`] when the input contains nothing to scrub.
#[allow(dead_code)] // wired into the support bundle archiver
pub fn scrub_user_paths(input: &str) -> Cow<'_, str> {
    match scrub_inner(input.as_bytes()) {
        None => Cow::Borrowed(input),
        // The pattern only ever splits on ASCII bytes and only ever inserts
        // ASCII, so a valid UTF-8 input always yields valid UTF-8 output; the
        // lossy branch is belt and braces rather than a reachable case.
        Some(scrubbed) => Cow::Owned(match String::from_utf8(scrubbed) {
            Ok(text) => text,
            Err(error) => String::from_utf8_lossy(error.as_bytes()).into_owned(),
        }),
    }
}

/// Byte-oriented variant for log files that may not be valid UTF-8.
///
/// Invalid byte sequences are preserved verbatim; only username segments are
/// rewritten. Returns [`Cow::Borrowed`] when the input contains nothing to
/// scrub.
#[allow(dead_code)] // wired into the support bundle archiver
pub fn scrub_user_paths_bytes(input: &[u8]) -> Cow<'_, [u8]> {
    match scrub_inner(input) {
        None => Cow::Borrowed(input),
        Some(scrubbed) => Cow::Owned(scrubbed),
    }
}
