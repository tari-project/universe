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

use std::borrow::Cow;

use super::log_path_scrub::{scrub_user_paths, scrub_user_paths_bytes};

#[test]
fn scrubs_windows_debug_printed_path() {
    let input = r#""C:\\Users\\MYUSERENAME\\AppData\\Local\\com.tari.universe\\mmproxy\\nextnet\\config/merge_mining_proxy""#;
    let expected = r#""C:\\Users\\<user>\\AppData\\Local\\com.tari.universe\\mmproxy\\nextnet\\config/merge_mining_proxy""#;

    assert_eq!(scrub_user_paths(input), expected);
}

#[test]
fn scrubs_windows_single_backslash_path() {
    let input = r"C:\Users\alice\AppData\Roaming\com.tari.universe\logs\app.log";
    let expected = r"C:\Users\<user>\AppData\Roaming\com.tari.universe\logs\app.log";

    assert_eq!(scrub_user_paths(input), expected);
}

#[test]
fn scrubs_windows_forward_slash_path_with_other_drive_letter() {
    let input = "D:/users/Bob.Smith/AppData/Local/com.tari.universe/logs";
    let expected = "D:/users/<user>/AppData/Local/com.tari.universe/logs";

    assert_eq!(scrub_user_paths(input), expected);
}

#[test]
fn scrubs_macos_path() {
    let input = "opened /Users/brianp/Library/Application Support/com.tari.universe/logs/app.log";
    let expected =
        "opened /Users/<user>/Library/Application Support/com.tari.universe/logs/app.log";

    assert_eq!(scrub_user_paths(input), expected);
}

#[test]
fn scrubs_linux_path() {
    let input = "config at /home/brianp/.local/share/com.tari.universe/nextnet/config.toml";
    let expected = "config at /home/<user>/.local/share/com.tari.universe/nextnet/config.toml";

    assert_eq!(scrub_user_paths(input), expected);
}

#[test]
fn scrubs_two_different_paths_on_one_line() {
    let input = r#"copy "C:\Users\alice\logs\a.log" -> /home/bob/backup/a.log"#;
    let expected = r#"copy "C:\Users\<user>\logs\a.log" -> /home/<user>/backup/a.log"#;

    assert_eq!(scrub_user_paths(input), expected);
}

#[test]
fn username_segment_ends_at_quote_whitespace_or_end_of_string() {
    assert_eq!(
        scrub_user_paths(r#""C:\Users\alice""#),
        r#""C:\Users\<user>""#
    );
    assert_eq!(
        scrub_user_paths("/home/alice then more"),
        "/home/<user> then more"
    );
    assert_eq!(scrub_user_paths("/home/alice"), "/home/<user>");
}

#[test]
fn text_without_paths_is_borrowed() {
    let input = "5 users connected to the node; no home directory here.";

    let scrubbed = scrub_user_paths(input);

    assert!(matches!(scrubbed, Cow::Borrowed(_)));
    assert_eq!(scrubbed, input);
}

#[test]
fn scrubbing_is_idempotent() {
    let input = r"C:\Users\alice\AppData\Local\com.tari.universe";

    let once = scrub_user_paths(input).into_owned();
    let twice = scrub_user_paths(&once);

    assert_eq!(twice, once);
    assert!(matches!(twice, Cow::Borrowed(_)));
}

#[test]
fn url_containing_users_segment_is_left_alone() {
    let input = "see https://example.com/users/123 and https://example.com/home/alice";

    let scrubbed = scrub_user_paths(input);

    assert!(matches!(scrubbed, Cow::Borrowed(_)));
    assert_eq!(scrubbed, input);
}

#[test]
fn url_on_the_same_line_does_not_hide_a_real_path() {
    let input = r#"{"url":"https://example.com/users/123","path":"C:\\Users\\alice\\logs"}"#;
    let expected = r#"{"url":"https://example.com/users/123","path":"C:\\Users\\<user>\\logs"}"#;

    assert_eq!(scrub_user_paths(input), expected);
}

#[test]
fn bytes_input_without_paths_is_borrowed() {
    let input = b"nothing to see here".as_slice();

    assert!(matches!(scrub_user_paths_bytes(input), Cow::Borrowed(_)));
}

#[test]
fn invalid_utf8_bytes_do_not_panic_and_are_preserved() {
    let mut input = b"prefix \xF0\x28\x8C\x28 /home/alice/.local/share ".to_vec();
    input.extend_from_slice(b"\xFF\xFE tail");

    let scrubbed = scrub_user_paths_bytes(&input);

    let mut expected = b"prefix \xF0\x28\x8C\x28 /home/<user>/.local/share ".to_vec();
    expected.extend_from_slice(b"\xFF\xFE tail");
    assert_eq!(scrubbed.as_ref(), expected.as_slice());
}

#[test]
fn invalid_utf8_in_the_username_itself_does_not_panic() {
    let mut input = b"/home/al\xFFice/.config".to_vec();
    input.extend_from_slice(b" end");

    let scrubbed = scrub_user_paths_bytes(&input);

    assert_eq!(scrubbed.as_ref(), b"/home/<user>/.config end".as_slice());
}

#[test]
fn multibyte_username_is_scrubbed_without_breaking_utf8() {
    let input = "/home/josé/.local/share/com.tari.universe";

    assert_eq!(
        scrub_user_paths(input),
        "/home/<user>/.local/share/com.tari.universe"
    );
}
