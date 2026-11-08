import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const writeText = vi.fn();
const readText = vi.fn();
const clear = vi.fn();

vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({
    writeText: (...args: unknown[]) => writeText(...args),
    readText: (...args: unknown[]) => readText(...args),
    clear: (...args: unknown[]) => clear(...args),
}));

import { ClipboardUnavailableError, clearClipboard, readFromClipboard, writeToClipboard } from './clipboard';

const setWebviewClipboard = (impl: Partial<Clipboard> | undefined) => {
    Object.defineProperty(navigator, 'clipboard', {
        value: impl,
        configurable: true,
        writable: true,
    });
};

const webviewWrite = () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setWebviewClipboard({ writeText } as unknown as Clipboard);
    return writeText;
};

describe('clipboard', () => {
    beforeEach(() => {
        writeText.mockReset().mockResolvedValue(undefined);
        readText.mockReset().mockResolvedValue(undefined);
        clear.mockReset().mockResolvedValue(undefined);
    });

    afterEach(() => {
        setWebviewClipboard(undefined);
    });

    describe('writeToClipboard', () => {
        it('writes through the webview when it is available', async () => {
            const webview = webviewWrite();

            await writeToClipboard('address');

            expect(webview).toHaveBeenCalledWith('address');
            expect(writeText).not.toHaveBeenCalled();
        });

        it('prefers the webview, which is the only working path in the Flatpak under Wayland', async () => {
            // The plugin is what fails there: no DISPLAY, so arboard falls back to X11
            // and times out. The webview goes through GTK and succeeds.
            const webview = webviewWrite();
            writeText.mockRejectedValue(new Error('X11 server connection timed out because it was unreachable'));

            await writeToClipboard('seed words');

            expect(webview).toHaveBeenCalledWith('seed words');
            expect(writeText).not.toHaveBeenCalled();
        });

        it('falls back to the plugin when the webview write fails', async () => {
            const webview = vi.fn().mockRejectedValue(new Error('not allowed'));
            setWebviewClipboard({ writeText: webview } as unknown as Clipboard);

            await writeToClipboard('address');

            expect(webview).toHaveBeenCalledWith('address');
            expect(writeText).toHaveBeenCalledWith('address');
        });

        it('uses the plugin when there is no webview clipboard at all', async () => {
            setWebviewClipboard(undefined);

            await writeToClipboard('address');

            expect(writeText).toHaveBeenCalledWith('address');
        });

        it('throws ClipboardUnavailableError when both paths fail', async () => {
            const webview = vi.fn().mockRejectedValue(new Error('webview denied'));
            setWebviewClipboard({ writeText: webview } as unknown as Clipboard);
            writeText.mockRejectedValue(new Error('X11 timed out'));

            await expect(writeToClipboard('seed words')).rejects.toBeInstanceOf(ClipboardUnavailableError);
        });

        it('carries both underlying errors on the thrown ClipboardUnavailableError', async () => {
            const webviewError = new Error('webview denied');
            const pluginError = new Error('X11 timed out');
            setWebviewClipboard({ writeText: vi.fn().mockRejectedValue(webviewError) } as unknown as Clipboard);
            writeText.mockRejectedValue(pluginError);

            try {
                await writeToClipboard('seed words');
                expect.unreachable('should have thrown');
            } catch (e) {
                expect(e).toBeInstanceOf(ClipboardUnavailableError);
                expect((e as ClipboardUnavailableError).detail).toEqual({ webviewError, pluginError });
            }
        });

        it('does not call the plugin when the webview write succeeds', async () => {
            webviewWrite();

            await writeToClipboard('address');

            expect(writeText).not.toHaveBeenCalled();
        });
    });

    describe('readFromClipboard', () => {
        it('reads through the webview when it is available', async () => {
            const readTextWebview = vi.fn().mockResolvedValue('from webview');
            setWebviewClipboard({ readText: readTextWebview } as unknown as Clipboard);

            await expect(readFromClipboard()).resolves.toBe('from webview');
            expect(readText).not.toHaveBeenCalled();
        });

        it('falls back to the plugin when the webview read fails', async () => {
            setWebviewClipboard({
                readText: vi.fn().mockRejectedValue(new Error('denied')),
            } as unknown as Clipboard);
            readText.mockResolvedValue('from plugin');

            await expect(readFromClipboard()).resolves.toBe('from plugin');
        });

        it('resolves to undefined rather than throwing, so the polling effect survives', async () => {
            setWebviewClipboard({
                readText: vi.fn().mockRejectedValue(new Error('denied')),
            } as unknown as Clipboard);
            readText.mockRejectedValue(new Error('X11 timed out'));

            await expect(readFromClipboard()).resolves.toBeUndefined();
        });

        it('uses the plugin when there is no webview clipboard', async () => {
            setWebviewClipboard(undefined);
            readText.mockResolvedValue('from plugin');

            await expect(readFromClipboard()).resolves.toBe('from plugin');
        });
    });

    describe('clearClipboard', () => {
        it('clears through the webview by writing an empty string', async () => {
            const webview = webviewWrite();

            await clearClipboard();

            expect(webview).toHaveBeenCalledWith('');
            expect(clear).not.toHaveBeenCalled();
        });

        it('falls back to the plugin clear when the webview write fails', async () => {
            setWebviewClipboard({
                writeText: vi.fn().mockRejectedValue(new Error('denied')),
            } as unknown as Clipboard);

            await clearClipboard();

            expect(clear).toHaveBeenCalledTimes(1);
        });

        it('uses the plugin clear when there is no webview clipboard', async () => {
            setWebviewClipboard(undefined);

            await clearClipboard();

            expect(clear).toHaveBeenCalledTimes(1);
        });
    });
});
