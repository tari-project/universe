import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The Flatpak/Wayland bug (#3489) came back twice because a component reached
 * for the clipboard directly instead of the shared helper. These tests fail when
 * a new direct call site appears, so the sandbox-safe path stays the only one.
 */

// vitest runs from the repository root.
const SRC_DIR = join(process.cwd(), 'src');
const SHARED_MODULE = 'utils/clipboard.ts';
const SHARED_HOOK = 'hooks/helpers/useCopyToClipboard.ts';

function sourceFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) return sourceFiles(full);
        if (!/\.(ts|tsx)$/.test(entry.name)) return [];
        // Tests are allowed to mock the plugin, and so is the shared module.
        if (/\.test\.(ts|tsx)$/.test(entry.name)) return [];
        return [full];
    });
}

function importersOf(specifier: string): string[] {
    return sourceFiles(SRC_DIR)
        .filter((file) => readFileSync(file, 'utf8').includes(`from '${specifier}'`))
        .map((file) => relative(SRC_DIR, file).split('\\').join('/'))
        .sort();
}

describe('clipboard call sites', () => {
    it('only the shared module imports the tauri clipboard plugin', () => {
        expect(importersOf('@tauri-apps/plugin-clipboard-manager')).toEqual([SHARED_MODULE]);
    });

    it('only the shared module touches navigator.clipboard', () => {
        const offenders = sourceFiles(SRC_DIR)
            .filter((file) => readFileSync(file, 'utf8').includes('navigator.clipboard'))
            .map((file) => relative(SRC_DIR, file).split('\\').join('/'))
            .sort();

        expect(offenders).toEqual([SHARED_MODULE]);
    });

    it('the bug report call sites go through the shared hook', () => {
        const expected = [
            'containers/floating/Settings/sections/mcp/AgentConfig.tsx',
            'containers/floating/Settings/sections/mcp/TokenDisplay.tsx',
        ];

        for (const file of expected) {
            const source = readFileSync(join(SRC_DIR, file), 'utf8');
            expect(source).toContain(`from '@app/${SHARED_HOOK.replace(/\.ts$/, '')}'`);
            expect(source).toContain('copyToClipboard');
        }
    });
});
