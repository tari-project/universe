import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToastStore } from '@app/components/ToastStack/useToastStore';

const writeText = vi.fn();
const readText = vi.fn();
const clear = vi.fn();

vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({
    writeText: (...args: unknown[]) => writeText(...args),
    readText: (...args: unknown[]) => readText(...args),
    clear: (...args: unknown[]) => clear(...args),
}));

import { useCopyToClipboard } from './useCopyToClipboard';

describe('useCopyToClipboard', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        writeText.mockReset().mockResolvedValue(undefined);
        readText.mockReset();
        clear.mockReset().mockResolvedValue(undefined);
        useToastStore.setState({ toasts: [] });
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
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => result.current.copyToClipboard(seed, undefined, { clearAfterMs: 60_000 }));
        await act(async () => result.current.copyToClipboard('new value'));
        expect(clear).not.toHaveBeenCalled();
        await act(async () => vi.advanceTimersByTimeAsync(60_000));
        expect(clear).toHaveBeenCalledTimes(1);
        consoleError.mockRestore();
    });

    it('tells the user to copy manually when every clipboard path fails', async () => {
        writeText.mockRejectedValue(new Error('X11 server connection timed out'));
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current.copyToClipboard('seed words');
        });

        expect(result.current.isCopied).toBe(false);
        const toasts = useToastStore.getState().toasts;
        expect(toasts).toHaveLength(1);
        expect(toasts[0].title).toBe('Failed to copy to clipboard');
        expect(toasts[0].text).toContain('copy it manually');
        consoleError.mockRestore();
    });

    it('warns when the scheduled wipe of a secret fails', async () => {
        const seed = 'word '.repeat(24).trim();
        readText.mockResolvedValue(seed);
        clear.mockRejectedValue(new Error('X11 server connection timed out'));
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current.copyToClipboard(seed, undefined, { clearAfterMs: 60_000 });
        });
        await act(async () => {
            await vi.advanceTimersByTimeAsync(60_000);
        });

        const toasts = useToastStore.getState().toasts;
        expect(toasts).toHaveLength(1);
        expect(toasts[0].title).toBe('Could not clear the clipboard');
        expect(toasts[0].type).toBe('warning');
        consoleError.mockRestore();
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
