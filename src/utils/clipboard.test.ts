import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const writeText = vi.fn();
const readText = vi.fn();
const clear = vi.fn();

vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({
    writeText: (...args: unknown[]) => writeText(...args),
    readText: (...args: unknown[]) => readText(...args),
    clear: (...args: unknown[]) => clear(...args),
}));

import {
    ClipboardWriteError,
    PLUGIN_TIMEOUT_MS,
    clearClipboardIfMatches,
    copyTextToClipboard,
    readClipboardText,
} from './clipboard';

function setWebviewClipboard(value: Partial<Clipboard> | undefined) {
    Object.defineProperty(navigator, 'clipboard', {
        value,
        configurable: true,
        writable: true,
    });
}

describe('copyTextToClipboard', () => {
    beforeEach(() => {
        writeText.mockReset().mockResolvedValue(undefined);
        readText.mockReset();
        clear.mockReset().mockResolvedValue(undefined);
        setWebviewClipboard(undefined);
    });

    afterEach(() => {
        setWebviewClipboard(undefined);
        vi.restoreAllMocks();
    });

    it('uses the native plugin first so other platforms are unchanged', async () => {
        const webviewWrite = vi.fn().mockResolvedValue(undefined);
        setWebviewClipboard({ writeText: webviewWrite } as unknown as Clipboard);

        await expect(copyTextToClipboard('seed words')).resolves.toBe('tauri');
        expect(writeText).toHaveBeenCalledWith('seed words');
        expect(webviewWrite).not.toHaveBeenCalled();
    });

    it('falls back to the webview clipboard when the plugin fails', async () => {
        writeText.mockRejectedValue(new Error('X11 server connection timed out'));
        const webviewWrite = vi.fn().mockResolvedValue(undefined);
        setWebviewClipboard({ writeText: webviewWrite } as unknown as Clipboard);

        await expect(copyTextToClipboard('seed words')).resolves.toBe('webview');
        expect(webviewWrite).toHaveBeenCalledWith('seed words');
    });

    it('falls back to execCommand when the plugin and the webview API both fail', async () => {
        writeText.mockRejectedValue(new Error('X11 server connection timed out'));
        setWebviewClipboard({
            writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')),
        } as unknown as Clipboard);
        const execCommand = vi.fn().mockReturnValue(true);
        Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });

        await expect(copyTextToClipboard('seed words')).resolves.toBe('execCommand');
        expect(execCommand).toHaveBeenCalledWith('copy');
        expect(document.querySelector('textarea')).toBeNull();
    });

    it('reports every attempted mechanism when all of them fail', async () => {
        writeText.mockRejectedValue(new Error('X11 server connection timed out'));
        setWebviewClipboard({
            writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')),
        } as unknown as Clipboard);
        Object.defineProperty(document, 'execCommand', {
            value: vi.fn().mockReturnValue(false),
            configurable: true,
        });

        const error = await copyTextToClipboard('seed words').catch((e: unknown) => e);
        expect(error).toBeInstanceOf(ClipboardWriteError);
        expect((error as ClipboardWriteError).attempts).toHaveLength(3);
        expect((error as ClipboardWriteError).attempts[0]).toContain('X11 server connection timed out');
    });

    it('gives up on a hung plugin instead of freezing the copy button', async () => {
        // Inside the Flatpak sandbox arboard blocks on an X11 connection that
        // never appears: the promise neither resolves nor rejects.
        vi.useFakeTimers();
        writeText.mockReturnValue(
            new Promise(() => {
                // arboard never settles here: it is blocked on an X11 connection.
            }) as never
        );
        const webviewWrite = vi.fn().mockResolvedValue(undefined);
        setWebviewClipboard({ writeText: webviewWrite } as unknown as Clipboard);

        const pending = copyTextToClipboard('seed words');
        await vi.advanceTimersByTimeAsync(PLUGIN_TIMEOUT_MS);

        await expect(pending).resolves.toBe('webview');
        expect(webviewWrite).toHaveBeenCalledWith('seed words');
        vi.useRealTimers();
    });
});

describe('readClipboardText', () => {
    beforeEach(() => {
        readText.mockReset();
        setWebviewClipboard(undefined);
    });

    afterEach(() => {
        setWebviewClipboard(undefined);
    });

    it('reads through the plugin when it works', async () => {
        readText.mockResolvedValue('from plugin');
        await expect(readClipboardText()).resolves.toBe('from plugin');
    });

    it('falls back to the webview clipboard', async () => {
        readText.mockRejectedValue(new Error('X11 server connection timed out'));
        setWebviewClipboard({ readText: vi.fn().mockResolvedValue('from webview') } as unknown as Clipboard);

        await expect(readClipboardText()).resolves.toBe('from webview');
    });

    it('returns null when no clipboard can be read', async () => {
        readText.mockRejectedValue(new Error('X11 server connection timed out'));
        await expect(readClipboardText()).resolves.toBeNull();
    });

    it('does not block on a hung plugin read', async () => {
        vi.useFakeTimers();
        readText.mockReturnValue(
            new Promise(() => {
                // arboard never settles here: it is blocked on an X11 connection.
            }) as never
        );
        setWebviewClipboard({ readText: vi.fn().mockResolvedValue('from webview') } as unknown as Clipboard);

        const pending = readClipboardText();
        await vi.advanceTimersByTimeAsync(PLUGIN_TIMEOUT_MS);

        await expect(pending).resolves.toBe('from webview');
        vi.useRealTimers();
    });
});

describe('clearClipboardIfMatches', () => {
    beforeEach(() => {
        writeText.mockReset().mockResolvedValue(undefined);
        readText.mockReset();
        clear.mockReset().mockResolvedValue(undefined);
        setWebviewClipboard(undefined);
    });

    it('clears when the clipboard still holds our secret', async () => {
        readText.mockResolvedValue('our seed');
        await clearClipboardIfMatches('our seed');
        expect(clear).toHaveBeenCalledTimes(1);
    });

    it('leaves a value the user copied in the meantime alone', async () => {
        readText.mockResolvedValue('something else');
        await clearClipboardIfMatches('our seed');
        expect(clear).not.toHaveBeenCalled();
        expect(writeText).not.toHaveBeenCalled();
    });

    it('overwrites through the webview when the plugin clear fails', async () => {
        readText.mockResolvedValue('our seed');
        clear.mockRejectedValue(new Error('X11 server connection timed out'));
        writeText.mockRejectedValue(new Error('X11 server connection timed out'));
        const webviewWrite = vi.fn().mockResolvedValue(undefined);
        setWebviewClipboard({ writeText: webviewWrite } as unknown as Clipboard);

        await clearClipboardIfMatches('our seed');
        expect(webviewWrite).toHaveBeenCalledWith('');
    });

    it('still wipes the secret when the plugin clear hangs', async () => {
        vi.useFakeTimers();
        readText.mockResolvedValue('our seed');
        clear.mockReturnValue(
            new Promise(() => {
                // arboard never settles here: it is blocked on an X11 connection.
            }) as never
        );
        writeText.mockRejectedValue(new Error('X11 server connection timed out'));
        const webviewWrite = vi.fn().mockResolvedValue(undefined);
        setWebviewClipboard({ writeText: webviewWrite } as unknown as Clipboard);

        const pending = clearClipboardIfMatches('our seed');
        await vi.advanceTimersByTimeAsync(PLUGIN_TIMEOUT_MS);
        await pending;

        expect(webviewWrite).toHaveBeenCalledWith('');
        vi.useRealTimers();
    });
});
