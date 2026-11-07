import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pluginWriteText = vi.fn();
const pluginReadText = vi.fn();
const pluginClear = vi.fn();

vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({
    writeText: (...args: unknown[]) => pluginWriteText(...args),
    readText: (...args: unknown[]) => pluginReadText(...args),
    clear: (...args: unknown[]) => pluginClear(...args),
}));

import { clearClipboardText, readClipboardText, writeClipboardText } from './clipboard';

function stubWebviewClipboard(clipboard: Partial<Clipboard> | undefined) {
    Object.defineProperty(window.navigator, 'clipboard', {
        value: clipboard,
        configurable: true,
    });
}

describe('clipboard', () => {
    beforeEach(() => {
        pluginWriteText.mockReset().mockResolvedValue(undefined);
        pluginReadText.mockReset().mockResolvedValue('plugin text');
        pluginClear.mockReset().mockResolvedValue(undefined);
        stubWebviewClipboard(undefined);
    });

    afterEach(() => {
        stubWebviewClipboard(undefined);
    });

    describe('writeClipboardText', () => {
        it('writes through the webview when the Clipboard API is available', async () => {
            const webviewWrite = vi.fn().mockResolvedValue(undefined);
            stubWebviewClipboard({ writeText: webviewWrite });

            await writeClipboardText('tari address');

            expect(webviewWrite).toHaveBeenCalledWith('tari address');
            expect(pluginWriteText).not.toHaveBeenCalled();
        });

        it('falls back to the plugin when the webview write is refused', async () => {
            const webviewWrite = vi.fn().mockRejectedValue(new Error('NotAllowedError'));
            stubWebviewClipboard({ writeText: webviewWrite });

            await writeClipboardText('seed words');

            expect(webviewWrite).toHaveBeenCalledTimes(1);
            expect(pluginWriteText).toHaveBeenCalledWith('seed words');
        });

        it('uses the plugin when the webview has no Clipboard API', async () => {
            await writeClipboardText('logs path');

            expect(pluginWriteText).toHaveBeenCalledWith('logs path');
        });

        it('rejects when both the webview and the plugin fail', async () => {
            stubWebviewClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) });
            pluginWriteText.mockRejectedValue(new Error('X11 server connection timed out'));

            await expect(writeClipboardText('x')).rejects.toThrow('X11 server connection timed out');
        });
    });

    describe('readClipboardText', () => {
        it('reads through the plugin first', async () => {
            const webviewRead = vi.fn().mockResolvedValue('webview text');
            stubWebviewClipboard({ readText: webviewRead });

            await expect(readClipboardText()).resolves.toBe('plugin text');
            expect(webviewRead).not.toHaveBeenCalled();
        });

        it('falls back to the webview when the plugin read fails', async () => {
            pluginReadText.mockRejectedValue(new Error('X11 server connection timed out'));
            stubWebviewClipboard({ readText: vi.fn().mockResolvedValue('webview text') });

            await expect(readClipboardText()).resolves.toBe('webview text');
        });

        it('rejects with the plugin error when there is no webview fallback', async () => {
            pluginReadText.mockRejectedValue(new Error('X11 server connection timed out'));

            await expect(readClipboardText()).rejects.toThrow('X11 server connection timed out');
        });
    });

    describe('clearClipboardText', () => {
        it('clears through the plugin first', async () => {
            const webviewWrite = vi.fn().mockResolvedValue(undefined);
            stubWebviewClipboard({ writeText: webviewWrite });

            await clearClipboardText();

            expect(pluginClear).toHaveBeenCalledTimes(1);
            expect(webviewWrite).not.toHaveBeenCalled();
        });

        it('falls back to a webview empty write when the plugin clear fails', async () => {
            pluginClear.mockRejectedValue(new Error('X11 server connection timed out'));
            const webviewWrite = vi.fn().mockResolvedValue(undefined);
            stubWebviewClipboard({ writeText: webviewWrite });

            await clearClipboardText();

            expect(webviewWrite).toHaveBeenCalledWith('');
        });
    });
});
