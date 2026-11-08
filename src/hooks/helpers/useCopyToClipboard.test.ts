import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const writeText = vi.fn();
const readText = vi.fn();
const clear = vi.fn();

vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({
    writeText: (...args: unknown[]) => writeText(...args),
    readText: (...args: unknown[]) => readText(...args),
    clear: (...args: unknown[]) => clear(...args),
}));

import { useCopyToClipboard } from './useCopyToClipboard';

const webviewWriteText = vi.fn();
const webviewReadText = vi.fn();

const setWebviewClipboard = (available: boolean) => {
    Object.defineProperty(navigator, 'clipboard', {
        value: available ? { writeText: webviewWriteText, readText: webviewReadText } : undefined,
        configurable: true,
        writable: true,
    });
};

describe('useCopyToClipboard', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        writeText.mockReset().mockResolvedValue(undefined);
        readText.mockReset();
        clear.mockReset().mockResolvedValue(undefined);
        webviewWriteText.mockReset().mockResolvedValue(undefined);
        webviewReadText.mockReset().mockResolvedValue(undefined);
        // The hook prefers the webview path, so every pre-existing test runs with the
        // webview clipboard present and healthy.
        setWebviewClipboard(true);
    });

    afterEach(() => {
        setWebviewClipboard(false);
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('does not clear the clipboard when no clearAfterMs is given', async () => {
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current.copyToClipboard('tari address');
        });
        await act(async () => {
            await vi.advanceTimersByTimeAsync(120_000);
        });

        expect(webviewWriteText).toHaveBeenCalledWith('tari address');
        expect(clear).not.toHaveBeenCalled();
    });

    it('clears a secret from the clipboard once the timeout elapses', async () => {
        const seed = 'word '.repeat(24).trim();
        webviewReadText.mockResolvedValue(seed);
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current.copyToClipboard(seed, undefined, { clearAfterMs: 60_000 });
        });
        expect(clear).not.toHaveBeenCalled();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(60_000);
        });

        expect(webviewWriteText).toHaveBeenLastCalledWith('');
    });

    it('leaves the clipboard alone if the user copied something else', async () => {
        const seed = 'word '.repeat(24).trim();
        webviewReadText.mockResolvedValue('an address the user copied after');
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current.copyToClipboard(seed, undefined, { clearAfterMs: 60_000 });
        });
        await act(async () => {
            await vi.advanceTimersByTimeAsync(60_000);
        });

        expect(webviewWriteText).not.toHaveBeenCalledWith('');
    });

    it('restarts the secret-clear timer when the same value is copied again', async () => {
        const seed = 'word '.repeat(24).trim();
        webviewReadText.mockResolvedValue(seed);
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => result.current.copyToClipboard(seed, undefined, { clearAfterMs: 60_000 }));
        await act(async () => vi.advanceTimersByTimeAsync(50_000));
        await act(async () => result.current.copyToClipboard(seed, undefined, { clearAfterMs: 60_000 }));
        await act(async () => vi.advanceTimersByTimeAsync(10_000));
        expect(webviewWriteText).not.toHaveBeenCalledWith('');
        await act(async () => vi.advanceTimersByTimeAsync(50_000));
        expect(webviewWriteText).toHaveBeenLastCalledWith('');
    });

    it('keeps the previous secret timer when a later copy fails', async () => {
        const seed = 'word '.repeat(24).trim();
        webviewReadText.mockResolvedValue(seed);
        webviewWriteText.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('clipboard busy'));
        writeText.mockRejectedValue(new Error('clipboard busy'));
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => result.current.copyToClipboard(seed, undefined, { clearAfterMs: 60_000 }));
        await act(async () => result.current.copyToClipboard('new value'));
        expect(webviewWriteText).not.toHaveBeenCalledWith('');
        await act(async () => vi.advanceTimersByTimeAsync(60_000));
        expect(webviewWriteText).toHaveBeenLastCalledWith('');
        consoleError.mockRestore();
    });

    it('still clears on schedule after the component unmounts', async () => {
        const seed = 'word '.repeat(24).trim();
        webviewReadText.mockResolvedValue(seed);
        const { result, unmount } = renderHook(() => useCopyToClipboard());

        await act(async () => result.current.copyToClipboard(seed, undefined, { clearAfterMs: 60_000 }));
        unmount();
        expect(webviewWriteText).not.toHaveBeenCalledWith('');
        await act(async () => vi.advanceTimersByTimeAsync(60_000));
        expect(webviewWriteText).toHaveBeenLastCalledWith('');
    });
});

describe('useCopyToClipboard under the Flatpak Wayland failure', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        writeText.mockReset().mockResolvedValue(undefined);
        readText.mockReset();
        clear.mockReset().mockResolvedValue(undefined);
        webviewWriteText.mockReset().mockResolvedValue(undefined);
        webviewReadText.mockReset().mockResolvedValue(undefined);
    });

    afterEach(() => {
        setWebviewClipboard(false);
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('reports a copy as done when the webview path succeeds and the plugin would have timed out', async () => {
        // The Flatpak-under-Wayland case: the plugin has no DISPLAY and times out.
        writeText.mockRejectedValue(new Error('X11 server connection timed out because it was unreachable'));
        setWebviewClipboard(true);
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current.copyToClipboard('seed words');
        });

        expect(result.current.isCopied).toBe(true);
        expect(webviewWriteText).toHaveBeenCalledWith('seed words');
        expect(writeText).not.toHaveBeenCalled();
    });

    it('does not report a copy as done when the webview path fails and there is no plugin fallback', async () => {
        webviewWriteText.mockRejectedValue(new Error('document is not focused'));
        writeText.mockRejectedValue(new Error('X11 server connection timed out because it was unreachable'));
        setWebviewClipboard(true);
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current.copyToClipboard('seed words');
        });

        expect(result.current.isCopied).toBe(false);
        consoleError.mockRestore();
    });

    it('still clears a secret on schedule when the write went through the webview', async () => {
        const seed = 'word '.repeat(24).trim();
        webviewReadText.mockResolvedValue(seed);
        setWebviewClipboard(true);
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current.copyToClipboard(seed, undefined, { clearAfterMs: 60_000 });
        });
        await act(async () => {
            await vi.advanceTimersByTimeAsync(60_000);
        });

        // The wipe writes an empty string through the same webview path.
        expect(webviewWriteText).toHaveBeenLastCalledWith('');
    });

    it('falls back to the plugin when the webview clipboard is absent', async () => {
        setWebviewClipboard(false);
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current.copyToClipboard('tari address');
        });

        expect(writeText).toHaveBeenCalledWith('tari address');
        expect(result.current.isCopied).toBe(true);
    });
});
