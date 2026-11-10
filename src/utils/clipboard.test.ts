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

describe('clipboard utilities', () => {
    const webWriteText = vi.fn();
    const webReadText = vi.fn();
    const originalExecCommand = document.execCommand;

    beforeEach(() => {
        pluginWriteText.mockReset().mockResolvedValue(undefined);
        pluginReadText.mockReset().mockResolvedValue('from-plugin');
        pluginClear.mockReset().mockResolvedValue(undefined);
        webWriteText.mockReset().mockResolvedValue(undefined);
        webReadText.mockReset().mockResolvedValue('from-web');

        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
                writeText: webWriteText,
                readText: webReadText,
            },
        });
        Object.defineProperty(document, 'execCommand', {
            configurable: true,
            value: undefined,
        });
    });

    afterEach(() => {
        Object.defineProperty(document, 'execCommand', {
            configurable: true,
            value: originalExecCommand,
        });
    });

    describe('writeClipboardText', () => {
        it('uses navigator.clipboard.writeText first so Wayland Flatpak does not block on X11 timeout', async () => {
            await writeClipboardText('tari123');

            expect(webWriteText).toHaveBeenCalledWith('tari123');
            expect(pluginWriteText).not.toHaveBeenCalled();
        });

        it('falls back to document.execCommand("copy") when navigator.clipboard.writeText rejects', async () => {
            webWriteText.mockRejectedValueOnce(new DOMException('NotAllowedError'));
            const execCommandMock = vi.fn().mockReturnValue(true);
            Object.defineProperty(document, 'execCommand', {
                configurable: true,
                value: execCommandMock,
            });

            await writeClipboardText('tari-token-secret');

            expect(webWriteText).toHaveBeenCalledWith('tari-token-secret');
            expect(execCommandMock).toHaveBeenCalledWith('copy');
            expect(pluginWriteText).not.toHaveBeenCalled();
        });

        it('falls back to the Tauri clipboard plugin when webview clipboard methods fail', async () => {
            webWriteText.mockRejectedValueOnce(new DOMException('NotAllowedError'));
            Object.defineProperty(document, 'execCommand', {
                configurable: true,
                value: vi.fn().mockReturnValue(false),
            });

            await writeClipboardText('tari123');

            expect(webWriteText).toHaveBeenCalledWith('tari123');
            expect(pluginWriteText).toHaveBeenCalledWith('tari123');
        });

        it('throws when both webview and Tauri clipboard writes fail', async () => {
            webWriteText.mockRejectedValueOnce(new Error('Web clipboard denied'));
            pluginWriteText.mockRejectedValueOnce(new Error('X11 connection failed'));

            await expect(writeClipboardText('tari123')).rejects.toThrow('X11 connection failed');
        });
    });

    describe('readClipboardText', () => {
        it('reads via the Tauri clipboard plugin first when available', async () => {
            const text = await readClipboardText();

            expect(text).toBe('from-plugin');
            expect(pluginReadText).toHaveBeenCalledTimes(1);
            expect(webReadText).not.toHaveBeenCalled();
        });

        it('falls back to navigator.clipboard.readText when the Tauri plugin fails', async () => {
            pluginReadText.mockRejectedValueOnce(new Error('No X11 display'));

            const text = await readClipboardText();

            expect(text).toBe('from-web');
            expect(pluginReadText).toHaveBeenCalledTimes(1);
            expect(webReadText).toHaveBeenCalledTimes(1);
        });
    });

    describe('clearClipboardText', () => {
        it('clears via the Tauri clipboard plugin first when available', async () => {
            await clearClipboardText();

            expect(pluginClear).toHaveBeenCalledTimes(1);
            expect(webWriteText).not.toHaveBeenCalled();
        });

        it('falls back to overwriting with an empty string via navigator.clipboard.writeText', async () => {
            pluginClear.mockRejectedValueOnce(new Error('No X11 display'));

            await clearClipboardText();

            expect(pluginClear).toHaveBeenCalledTimes(1);
            expect(webWriteText).toHaveBeenCalledWith('');
        });
    });
});
