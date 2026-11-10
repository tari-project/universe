import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToastStore } from '@app/components/ToastStack/useToastStore';

const writeText = vi.fn();
const readText = vi.fn();
const clear = vi.fn();
const navigatorWriteText = vi.fn();
const navigatorReadText = vi.fn();

vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({
    writeText: (...args: unknown[]) => writeText(...args),
    readText: (...args: unknown[]) => readText(...args),
    clear: (...args: unknown[]) => clear(...args),
}));

import { useCopyToClipboard, writeClipboardText } from './useCopyToClipboard';

describe('useCopyToClipboard', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        useToastStore.setState({ toasts: [] });
        writeText.mockReset().mockResolvedValue(undefined);
        readText.mockReset();
        clear.mockReset().mockResolvedValue(undefined);
        navigatorWriteText.mockReset().mockResolvedValue(undefined);
        navigatorReadText.mockReset();
        Object.defineProperty(navigator, 'clipboard', {
            value: {
                writeText: (...args: unknown[]) => navigatorWriteText(...args),
                readText: (...args: unknown[]) => navigatorReadText(...args),
            },
            configurable: true,
            writable: true,
        });
    });

    afterEach(() => {
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

        expect(writeText).toHaveBeenCalledWith('tari address');
        expect(clear).not.toHaveBeenCalled();
    });

    it('clears a secret from the clipboard once the timeout elapses', async () => {
        const seed = 'word '.repeat(24).trim();
        readText.mockResolvedValue(seed);
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current.copyToClipboard(seed, undefined, { clearAfterMs: 60_000 });
        });
        expect(clear).not.toHaveBeenCalled();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(60_000);
        });

        expect(clear).toHaveBeenCalledTimes(1);
    });

    it('leaves the clipboard alone if the user copied something else', async () => {
        const seed = 'word '.repeat(24).trim();
        readText.mockResolvedValue('an address the user copied after');
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current.copyToClipboard(seed, undefined, { clearAfterMs: 60_000 });
        });
        await act(async () => {
            await vi.advanceTimersByTimeAsync(60_000);
        });

        expect(clear).not.toHaveBeenCalled();
    });

    it('restarts the secret-clear timer when the same value is copied again', async () => {
        const seed = 'word '.repeat(24).trim();
        readText.mockResolvedValue(seed);
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => result.current.copyToClipboard(seed, undefined, { clearAfterMs: 60_000 }));
        await act(async () => vi.advanceTimersByTimeAsync(50_000));
        await act(async () => result.current.copyToClipboard(seed, undefined, { clearAfterMs: 60_000 }));
        await act(async () => vi.advanceTimersByTimeAsync(10_000));
        expect(clear).not.toHaveBeenCalled();
        await act(async () => vi.advanceTimersByTimeAsync(50_000));
        expect(clear).toHaveBeenCalledTimes(1);
    });

    it('keeps the previous secret timer when a later copy fails', async () => {
        const seed = 'word '.repeat(24).trim();
        readText.mockResolvedValue(seed);
        writeText.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('clipboard busy'));
        navigatorWriteText.mockRejectedValueOnce(new Error('navigator clipboard busy'));
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => result.current.copyToClipboard(seed, undefined, { clearAfterMs: 60_000 }));
        await act(async () => result.current.copyToClipboard('new value'));
        expect(clear).not.toHaveBeenCalled();
        expect(useToastStore.getState().toasts).toHaveLength(1);
        await act(async () => vi.advanceTimersByTimeAsync(60_000));
        expect(clear).toHaveBeenCalledTimes(1);
        consoleError.mockRestore();
    });

    it('falls back to navigator.clipboard.writeText when Tauri writeText fails under Wayland Flatpak', async () => {
        writeText.mockRejectedValueOnce(new Error('X11 server connection timed out'));
        navigatorWriteText.mockResolvedValueOnce(undefined);
        const onCopied = vi.fn();
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current.copyToClipboard('tari1waylandaddress', onCopied);
        });

        expect(writeText).toHaveBeenCalledWith('tari1waylandaddress');
        expect(navigatorWriteText).toHaveBeenCalledWith('tari1waylandaddress');
        expect(result.current.isCopied).toBe(true);
        expect(onCopied).toHaveBeenCalledTimes(1);
        expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('surfaces an error toast when both Tauri writeText and navigator.clipboard.writeText fail', async () => {
        writeText.mockRejectedValueOnce(new Error('X11 unavailable'));
        navigatorWriteText.mockRejectedValueOnce(new Error('WebView clipboard denied'));
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current.copyToClipboard('tari1address');
        });

        expect(result.current.isCopied).toBe(false);
        expect(useToastStore.getState().toasts).toHaveLength(1);
        expect(useToastStore.getState().toasts[0]?.type).toBe('error');
        consoleError.mockRestore();
    });

    it('writeClipboardText falls back to navigator.clipboard.writeText for direct callers', async () => {
        writeText.mockRejectedValueOnce(new Error('X11 unavailable'));
        navigatorWriteText.mockResolvedValueOnce(undefined);

        await expect(writeClipboardText('tu_secret_token')).resolves.toBeUndefined();
        expect(writeText).toHaveBeenCalledWith('tu_secret_token');
        expect(navigatorWriteText).toHaveBeenCalledWith('tu_secret_token');
    });

    it('still clears on schedule after the component unmounts', async () => {
        const seed = 'word '.repeat(24).trim();
        readText.mockResolvedValue(seed);
        const { result, unmount } = renderHook(() => useCopyToClipboard());

        await act(async () => result.current.copyToClipboard(seed, undefined, { clearAfterMs: 60_000 }));
        unmount();
        expect(clear).not.toHaveBeenCalled();
        await act(async () => vi.advanceTimersByTimeAsync(60_000));
        expect(clear).toHaveBeenCalledTimes(1);
    });
});
