import { beforeEach, describe, expect, it, vi } from 'vitest';

const writeText = vi.fn();
const readText = vi.fn();
const clear = vi.fn();

vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({
    writeText: (...args: unknown[]) => writeText(...args),
    readText: (...args: unknown[]) => readText(...args),
    clear: (...args: unknown[]) => clear(...args),
}));

import { clearClipboardText, readClipboardText, writeClipboardText } from './clipboard';

function mockExecCommand(result: boolean) {
    Object.defineProperty(document, 'execCommand', {
        configurable: true,
        writable: true,
        value: vi.fn(() => result),
    });
}

describe('writeClipboardText', () => {
    beforeEach(() => {
        writeText.mockReset().mockResolvedValue(undefined);
        readText.mockReset().mockResolvedValue('');
        clear.mockReset().mockResolvedValue(undefined);
        // jsdom does not implement execCommand, so install the stub the helper calls.
        mockExecCommand(false);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
                writeText: vi.fn().mockResolvedValue(undefined),
                readText: vi.fn().mockResolvedValue(''),
            },
        });
    });

    it('uses the plugin and leaves the webview alone outside the Flatpak Wayland sandbox', async () => {
        await writeClipboardText('tari address', { preferWebview: false });

        expect(writeText).toHaveBeenCalledWith('tari address');
        expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });

    it('falls back to the webview when the plugin rejects', async () => {
        writeText.mockRejectedValueOnce(new Error('clipboard busy'));

        await writeClipboardText('tari address', { preferWebview: false });

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('tari address');
    });

    it('writes through the webview under Flatpak Wayland and does not call the plugin', async () => {
        await writeClipboardText('seed words', { preferWebview: true });

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('seed words');
        expect(writeText).not.toHaveBeenCalled();
    });

    it('uses execCommand when the async webview clipboard rejects, still without the plugin', async () => {
        vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('NotAllowedError'));
        mockExecCommand(true);

        await writeClipboardText('seed words', { preferWebview: true });

        expect(document.execCommand).toHaveBeenCalledWith('copy');
        expect(writeText).not.toHaveBeenCalled();
    });

    it('throws when every write path fails so the caller can show an error', async () => {
        writeText.mockRejectedValueOnce(new Error('plugin down'));
        vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('webview down'));
        mockExecCommand(false);

        await expect(writeClipboardText('tari address', { preferWebview: false })).rejects.toThrow('plugin down');
    });

    it('throws without touching the plugin when the sandbox webview cannot write', async () => {
        vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('webview down'));
        mockExecCommand(false);

        await expect(writeClipboardText('tari address', { preferWebview: true })).rejects.toThrow(
            'Could not copy to the clipboard'
        );
        expect(writeText).not.toHaveBeenCalled();
    });
});

describe('readClipboardText and clearClipboardText', () => {
    beforeEach(() => {
        readText.mockReset().mockResolvedValue('from-plugin');
        clear.mockReset().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
                writeText: vi.fn().mockResolvedValue(undefined),
                readText: vi.fn().mockResolvedValue('from-webview'),
            },
        });
    });

    it('reads and clears through the plugin outside the sandbox', async () => {
        await expect(readClipboardText({ preferWebview: false })).resolves.toBe('from-plugin');
        await clearClipboardText({ preferWebview: false });

        expect(readText).toHaveBeenCalledTimes(1);
        expect(clear).toHaveBeenCalledTimes(1);
        expect(navigator.clipboard.readText).not.toHaveBeenCalled();
    });

    it('reads and clears through the webview in the sandbox and does not call the plugin', async () => {
        await expect(readClipboardText({ preferWebview: true })).resolves.toBe('from-webview');
        await clearClipboardText({ preferWebview: true });

        expect(navigator.clipboard.readText).toHaveBeenCalledTimes(1);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('');
        expect(readText).not.toHaveBeenCalled();
        expect(clear).not.toHaveBeenCalled();
    });
});
