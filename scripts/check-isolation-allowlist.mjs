#!/usr/bin/env node
// Copyright 2024 The Tari Project
// SPDX-License-Identifier: BSD-3-Clause

/**
 * Keeps the Tauri isolation-frame command allowlist honest.
 *
 * `dist-isolation/index.html` installs `window.__TAURI_ISOLATION_HOOK__`, which drops
 * any IPC command that is not on an explicit allowlist. That allowlist is a hand-written
 * copy of `tauri::generate_handler![...]` from `src-tauri/src/main.rs`, so it rots the
 * moment someone registers a new command. This script fails `pnpm lint` when the two
 * drift apart in either direction:
 *
 *   - a command is registered in main.rs but missing from the hook  -> the feature is
 *     silently broken at runtime (invoke rejects with an unknown-command error),
 *   - a command is on the hook's list but no longer registered      -> dead entry, and a
 *     hint that the list is being edited without being read.
 *
 * It also refuses blanket plugin matches (e.g. a bare `plugin:shell`), which would hand
 * an injected script the whole plugin surface.
 *
 * Run directly with: node ./scripts/check-isolation-allowlist.mjs
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MAIN_RS = resolve(repoRoot, 'src-tauri/src/main.rs');
const HOOK_HTML = resolve(repoRoot, 'dist-isolation/index.html');

const errors = [];

function read(path) {
    try {
        return readFileSync(path, 'utf8');
    } catch (e) {
        errors.push(`cannot read ${path}: ${e.message}`);
        return null;
    }
}

/** Extracts the bracket-balanced body of `tauri::generate_handler![ ... ]`. */
function parseRegisteredCommands(source) {
    const start = source.search(/tauri::generate_handler!\s*\[/);
    if (start === -1) {
        errors.push('could not find `tauri::generate_handler![` in src-tauri/src/main.rs');
        return [];
    }
    let i = source.indexOf('[', start) + 1;
    const bodyStart = i;
    let depth = 1;
    while (i < source.length && depth > 0) {
        const c = source[i];
        if (c === '[') depth += 1;
        else if (c === ']') depth -= 1;
        i += 1;
    }
    if (depth !== 0) {
        errors.push('unbalanced brackets in `tauri::generate_handler![...]`');
        return [];
    }

    return source
        .slice(bodyStart, i - 1)
        .replace(/\/\/[^\n]*/g, '') // line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => part.split('::').pop().trim())
        .filter((name) => {
            if (/^[a-z0-9_]+$/.test(name)) return true;
            errors.push(`unexpected entry in generate_handler!: ${JSON.stringify(name)}`);
            return false;
        });
}

/** Pulls the string literals out of a `var NAME = [ ... ];` array in the hook. */
function parseHookArray(html, name) {
    const re = new RegExp(`var\\s+${name}\\s*=\\s*\\[([\\s\\S]*?)\\];`);
    const match = html.match(re);
    if (!match) {
        errors.push(`could not find \`var ${name} = [...]\` in dist-isolation/index.html`);
        return [];
    }
    const body = match[1].replace(/\/\/[^\n]*/g, ''); // drop trailing `// why` comments
    return [...body.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function diff(a, b) {
    return [...a].filter((x) => !b.has(x));
}

const mainRs = read(MAIN_RS);
const hookHtml = read(HOOK_HTML);

if (mainRs !== null && hookHtml !== null) {
    if (!hookHtml.includes('__TAURI_ISOLATION_HOOK__')) {
        errors.push('dist-isolation/index.html no longer sets `window.__TAURI_ISOLATION_HOOK__` (the Tauri build will panic)');
    }
    if (!/var\s+ENFORCE\s*=\s*true\s*;/.test(hookHtml)) {
        errors.push('dist-isolation/index.html has `ENFORCE` set to something other than `true` - the allowlist is log-only');
    }

    const registered = new Set(parseRegisteredCommands(mainRs));
    const appAllowed = new Set(parseHookArray(hookHtml, 'ALLOWED_APP_COMMANDS'));
    const pluginAllowed = parseHookArray(hookHtml, 'ALLOWED_PLUGIN_COMMANDS');

    const missing = diff(registered, appAllowed);
    if (missing.length) {
        errors.push(
            `${missing.length} command(s) registered in main.rs but missing from ALLOWED_APP_COMMANDS ` +
                `(they would be blocked at runtime):\n    ${missing.join('\n    ')}`
        );
    }

    const stale = diff(appAllowed, registered);
    if (stale.length) {
        errors.push(
            `${stale.length} entr(y|ies) in ALLOWED_APP_COMMANDS are no longer registered in main.rs ` +
                `(remove them):\n    ${stale.join('\n    ')}`
        );
    }

    for (const cmd of pluginAllowed) {
        if (!/^plugin:[a-zA-Z0-9_-]+\|[a-zA-Z0-9_]+$/.test(cmd)) {
            errors.push(
                `ALLOWED_PLUGIN_COMMANDS entry ${JSON.stringify(cmd)} is not an exact ` +
                    '`plugin:<plugin>|<command>` string. Blanket plugin matches are not allowed.'
            );
        }
    }

    if (!errors.length) {
        console.log(
            `check-isolation-allowlist: ok (${registered.size} app commands, ${pluginAllowed.length} plugin commands allowlisted)`
        );
    }
}

if (errors.length) {
    console.error('check-isolation-allowlist: FAILED\n');
    for (const e of errors) console.error(`  - ${e}\n`);
    console.error('Fix dist-isolation/index.html so the isolation-frame allowlist matches the registered commands.');
    process.exit(1);
}
