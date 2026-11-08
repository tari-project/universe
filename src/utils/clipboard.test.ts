import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pluginWriteText = vi.fn();
const pluginReadText = vi.fn();
const pluginClear = vi.fn();

vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({
    writeText: (...args: unknown[]) => pluginWriteText(...args),
    readText: (...args: unknown[]) => pluginReadText(...args),
    clear: (...args: unknown[]) => pluginClear(...args),
}));

import { ClipboardUnavailableError, clearClipboardText, readClipboardText, writeClipboardText } from './clipboard';

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
        Object.defineProperty(document, 'execCommand', { value: undefined, configurable: true });
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

        it('falls back to the legacy execCommand copy when the webview write is refused', async () => {
            stubWebviewClipboard({ writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')) });
            const execCommand = vi.fn().mockReturnValue(true);
            Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });

            await writeClipboardText('seed words');

            expect(execCommand).toHaveBeenCalledWith('copy');
            expect(pluginWriteText).not.toHaveBeenCalled();
        });

        it('falls back to the plugin when the webview write and the legacy copy both fail', async () => {
            stubWebviewClipboard({ writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')) });
            Object.defineProperty(document, 'execCommand', {
                value: vi.fn().mockReturnValue(false),
                configurable: true,
            });

            await writeClipboardText('seed words');

            expect(pluginWriteText).toHaveBeenCalledWith('seed words');
        });

        it('rejects with a typed error carrying both failures when both paths fail', async () => {
            stubWebviewClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) });
            pluginWriteText.mockRejectedValue(new Error('X11 server connection timed out'));

            try {
                await writeClipboardText('x');
                expect.unreachable('write should have thrown');
            } catch (e) {
                expect(e).toBeInstanceOf(ClipboardUnavailableError);
                expect((e as ClipboardUnavailableError).message).toBe('Could not write to the clipboard');
                expect((e as ClipboardUnavailableError).pluginError).toBeInstanceOf(Error);
                expect((e as ClipboardUnavailableError).webviewError).toBeInstanceOf(Error);
            }
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

        it('rejects with a typed error carrying the plugin failure when there is no webview fallback', async () => {
            pluginReadText.mockRejectedValue(new Error('X11 server connection timed out'));

            try {
                await readClipboardText();
                expect.unreachable('read should have thrown');
            } catch (e) {
                expect(e).toBeInstanceOf(ClipboardUnavailableError);
                expect((e as ClipboardUnavailableError).message).toBe('Could not read from the clipboard');
                expect((e as ClipboardUnavailableError).pluginError).toBeInstanceOf(Error);
            }
        });

        it('rejects with a typed error carrying both failures when the webview read also fails', async () => {
            pluginReadText.mockRejectedValue(new Error('X11 server connection timed out'));
            stubWebviewClipboard({ readText: vi.fn().mockRejectedValue(new Error('denied')) });

            try {
                await readClipboardText();
                expect.unreachable('read should have thrown');
            } catch (e) {
                expect(e).toBeInstanceOf(ClipboardUnavailableError);
                expect((e as ClipboardUnavailableError).pluginError).toBeInstanceOf(Error);
                expect((e as ClipboardUnavailableError).webviewError).toBeInstanceOf(Error);
            }
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

        it('rejects with a typed error carrying both failures when the webview clear also fails', async () => {
            pluginClear.mockRejectedValue(new Error('X11 server connection timed out'));
            stubWebviewClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) });

            try {
                await clearClipboardText();
                expect.unreachable('clear should have thrown');
            } catch (e) {
                expect(e).toBeInstanceOf(ClipboardUnavailableError);
                expect((e as ClipboardUnavailableError).message).toBe('Could not clear the clipboard');
                expect((e as ClipboardUnavailableError).pluginError).toBeInstanceOf(Error);
                expect((e as ClipboardUnavailableError).webviewError).toBeInstanceOf(Error);
            }
        });
    });
});
