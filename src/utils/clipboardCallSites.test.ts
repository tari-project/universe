import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The Flatpak/Wayland copy bug (#3489) kept coming back for the same reason:
 * a component reached for the clipboard directly instead of the shared path,
 * so the sandbox-safe fallback never ran for that button. These tests read
 * the source tree and fail as soon as a new direct call site appears, so the
 * shared module and hook stay the only way clipboard code is reached.
 */

// Vitest runs from the repository root.
const SRC_DIR = join(process.cwd(), 'src');
const SHARED_MODULE = 'utils/clipboard.ts';
const SHARED_HOOK = 'hooks/helpers/useCopyToClipboard.ts';

function sourceFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) return sourceFiles(full);
        if (!/\.(ts|tsx)$/.test(entry.name)) return [];
        // Tests may mock the plugin, and so may the shared module's own tests.
        if (/\.test\.(ts|tsx)$/.test(entry.name)) return [];
        return [full];
    });
}

function toPosix(file: string): string {
    return relative(SRC_DIR, file).split('\\').join('/');
}

function filesContaining(needle: string): string[] {
    return sourceFiles(SRC_DIR)
        .filter((file) => readFileSync(file, 'utf8').includes(needle))
        .map(toPosix)
        .sort();
}

describe('clipboard call sites (#3489)', () => {
    it('only the shared module imports the Tauri clipboard plugin', () => {
        expect(filesContaining(`from '@tauri-apps/plugin-clipboard-manager'`)).toEqual([SHARED_MODULE]);
    });

    it('only the shared module touches navigator.clipboard', () => {
        expect(filesContaining('navigator.clipboard')).toEqual([SHARED_MODULE]);
    });

    it('only the shared module touches document.execCommand', () => {
        expect(filesContaining('execCommand')).toEqual([SHARED_MODULE]);
    });

    it('every copy button goes through the shared hook', () => {
        const copyCallSites = [
            'containers/floating/Settings/sections/mcp/AgentConfig.tsx',
            'containers/floating/Settings/sections/mcp/TokenDisplay.tsx',
            'containers/floating/ShareRewardModal/ShareRewardModal.tsx',
            'containers/floating/SwapDialogs/sections/ProcessingTransaction/ProcessingTransaction.tsx',
        ];

        for (const file of copyCallSites) {
            const source = readFileSync(join(SRC_DIR, file), 'utf8');
            expect(source).toContain(`from '@app/${SHARED_HOOK.replace(/\.ts$/, '')}'`);
            expect(source).toContain('copyToClipboard');
        }
    });

    it('the clipboard viewer reads through the shared module', () => {
        const source = readFileSync(
            join(SRC_DIR, 'components/exchanges/universal/clipboardViewer/ClipboardViewer.tsx'),
            'utf8'
        );
        expect(source).toContain(`from '@app/${SHARED_MODULE.replace(/\.ts$/, '')}'`);
        expect(source).toContain('readClipboardText');
    });
});
