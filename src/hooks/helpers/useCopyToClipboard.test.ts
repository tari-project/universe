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

import { useToastStore } from '@app/components/ToastStack/useToastStore';
import { useCopyToClipboard } from './useCopyToClipboard';

const SEED = 'word '.repeat(24).trim();

describe('useCopyToClipboard', () => {
    const originalNavigatorClipboard = navigator.clipboard;

    beforeEach(() => {
        vi.useFakeTimers();
        writeText.mockReset().mockResolvedValue(undefined);
        readText.mockReset();
        clear.mockReset().mockResolvedValue(undefined);
        useToastStore.setState({ toasts: [] });
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: undefined,
        });
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: originalNavigatorClipboard,
        });
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

    it.each([
        ['clears a secret once the timeout elapses', SEED, false, 1],
        ['leaves the clipboard alone if the user copied something else', 'an address the user copied after', false, 0],
        ['still clears on schedule after the component unmounts', SEED, true, 1],
    ])('%s', async (_, currentClipboardValue, shouldUnmount, expectedClearCalls) => {
        readText.mockResolvedValue(currentClipboardValue);
        const { result, unmount } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current.copyToClipboard(SEED, undefined, { clearAfterMs: 60_000 });
        });
        if (shouldUnmount) {
            unmount();
        }
        expect(clear).not.toHaveBeenCalled();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(60_000);
        });

        expect(clear).toHaveBeenCalledTimes(expectedClearCalls);
    });

    it('restarts the secret-clear timer when the same value is copied again', async () => {
        readText.mockResolvedValue(SEED);
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => result.current.copyToClipboard(SEED, undefined, { clearAfterMs: 60_000 }));
        await act(async () => vi.advanceTimersByTimeAsync(50_000));
        await act(async () => result.current.copyToClipboard(SEED, undefined, { clearAfterMs: 60_000 }));
        await act(async () => vi.advanceTimersByTimeAsync(10_000));
        expect(clear).not.toHaveBeenCalled();
        await act(async () => vi.advanceTimersByTimeAsync(50_000));
        expect(clear).toHaveBeenCalledTimes(1);
    });

    it('keeps the previous secret timer when a later copy fails', async () => {
        readText.mockResolvedValue(SEED);
        writeText.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('clipboard busy'));
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => result.current.copyToClipboard(SEED, undefined, { clearAfterMs: 60_000 }));
        await act(async () => result.current.copyToClipboard('new value'));
        expect(clear).not.toHaveBeenCalled();
        await act(async () => vi.advanceTimersByTimeAsync(60_000));
        expect(clear).toHaveBeenCalledTimes(1);
        consoleError.mockRestore();
    });

    it('copies and clears secrets via navigator.clipboard under Wayland Flatpak when the Tauri plugin fails', async () => {
        const webWriteText = vi.fn().mockResolvedValue(undefined);
        const webReadText = vi.fn().mockRejectedValue(new DOMException('NotAllowedError'));
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
                writeText: webWriteText,
                readText: webReadText,
            },
        });
        writeText.mockRejectedValue(new Error('No X11 display'));
        readText.mockRejectedValue(new Error('No X11 display'));
        clear.mockRejectedValue(new Error('No X11 display'));

        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current.copyToClipboard(SEED, undefined, { clearAfterMs: 60_000 });
        });

        expect(result.current.isCopied).toBe(true);
        expect(webWriteText).toHaveBeenCalledWith(SEED);
        expect(writeText).not.toHaveBeenCalled();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(60_000);
        });

        expect(webWriteText).toHaveBeenLastCalledWith('');
    });

    it('retries clearing the secret on window focus if background clear fails while unfocused', async () => {
        const webWriteText = vi
            .fn()
            .mockResolvedValueOnce(undefined)
            .mockRejectedValueOnce(new DOMException('Document is not focused'))
            .mockResolvedValueOnce(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
                writeText: webWriteText,
                readText: vi.fn().mockRejectedValue(new DOMException('NotAllowedError')),
            },
        });
        readText.mockRejectedValue(new Error('No X11 display'));
        clear.mockRejectedValue(new Error('No X11 display'));
        const hasFocusSpy = vi.spyOn(document, 'hasFocus').mockReturnValue(false);
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current.copyToClipboard(SEED, undefined, { clearAfterMs: 60_000 });
        });
        await act(async () => {
            await vi.advanceTimersByTimeAsync(60_000);
        });

        expect(webWriteText).toHaveBeenCalledTimes(2);

        await act(async () => {
            window.dispatchEvent(new Event('focus'));
        });

        expect(webWriteText).toHaveBeenCalledTimes(3);
        expect(webWriteText).toHaveBeenLastCalledWith('');

        hasFocusSpy.mockRestore();
        consoleError.mockRestore();
    });

    it('surfaces an error toast when copying fails across all clipboard backends', async () => {
        writeText.mockRejectedValueOnce(new Error('Clipboard unavailable'));
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current.copyToClipboard('tari address');
        });

        expect(result.current.isCopied).toBe(false);
        expect(useToastStore.getState().toasts).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    title: 'Could not copy to clipboard',
                    text: 'Clipboard unavailable',
                    type: 'error',
                }),
            ])
        );
        consoleError.mockRestore();
    });
});
