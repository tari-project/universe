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

use sys_locale::get_locale;

use crate::consts::DEFAULT_SYSTEM_LOCALE_FALLBACK;

use super::config_ui::ConfigUIContent;

#[test]
fn set_should_always_use_system_language_true_resolves_application_language() {
    let mut config = ConfigUIContent::default();
    let fallback_language = DEFAULT_SYSTEM_LOCALE_FALLBACK.to_string();
    let expected_language = get_locale().unwrap_or_else(|| fallback_language.clone());

    config.set_should_always_use_system_language_and_resolve_language((true, fallback_language));

    assert!(*config.should_always_use_system_language());
    assert!(*config.has_system_language_been_proposed());
    assert_eq!(config.application_language(), &expected_language);
}

#[test]
fn set_should_always_use_system_language_false_keeps_selected_language() {
    let mut config = ConfigUIContent::default();
    config.set_application_language("fr".to_string());

    config.set_should_always_use_system_language_and_resolve_language((
        false,
        DEFAULT_SYSTEM_LOCALE_FALLBACK.to_string(),
    ));

    assert!(!*config.should_always_use_system_language());
    assert!(!*config.has_system_language_been_proposed());
    assert_eq!(config.application_language(), "fr");
}
