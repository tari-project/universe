import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWindowVisibility } from './useWindowVisibility.ts';

const mockIsMinimized = vi.fn().mockResolvedValue(false);
let mockOnFocusChangedCallback: ((event: { payload: boolean }) => void) | null = null;
const mockUnlisten = vi.fn();

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: () => ({
        isMinimized: mockIsMinimized,
        onFocusChanged: vi.fn((cb) => {
            mockOnFocusChangedCallback = cb;
            return Promise.resolve(mockUnlisten);
        }),
    }),
}));

describe('useWindowVisibility', () => {
    let originalHidden: PropertyDescriptor | undefined;

    beforeEach(() => {
        vi.clearAllMocks();
        mockOnFocusChangedCallback = null;
        originalHidden = Object.getOwnPropertyDescriptor(document, 'hidden');
    });

    afterEach(() => {
        if (originalHidden) {
            Object.defineProperty(document, 'hidden', originalHidden);
        }
    });

    it('returns false initially when document is not hidden', () => {
        Object.defineProperty(document, 'hidden', { value: false, configurable: true });
        const { result } = renderHook(() => useWindowVisibility());
        expect(result.current).toBe(false);
    });

    it('returns true initially when document is hidden', () => {
        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        const { result } = renderHook(() => useWindowVisibility());
        expect(result.current).toBe(true);
    });

    it('updates when visibilitychange event fires', () => {
        Object.defineProperty(document, 'hidden', { value: false, configurable: true });
        const { result } = renderHook(() => useWindowVisibility());
        expect(result.current).toBe(false);

        act(() => {
            Object.defineProperty(document, 'hidden', { value: true, configurable: true });
            document.dispatchEvent(new Event('visibilitychange'));
        });

        expect(result.current).toBe(true);

        act(() => {
            Object.defineProperty(document, 'hidden', { value: false, configurable: true });
            document.dispatchEvent(new Event('visibilitychange'));
        });

        expect(result.current).toBe(false);
    });

    it('updates when Tauri window onFocusChanged fires', async () => {
        Object.defineProperty(document, 'hidden', { value: false, configurable: true });
        const { result } = renderHook(() => useWindowVisibility());

        // Wait for onFocusChanged promise to register callback
        await Promise.resolve();

        expect(mockOnFocusChangedCallback).not.toBeNull();

        act(() => {
            mockOnFocusChangedCallback?.({ payload: true });
        });
        expect(result.current).toBe(false);

        act(() => {
            Object.defineProperty(document, 'hidden', { value: true, configurable: true });
            mockOnFocusChangedCallback?.({ payload: false });
        });
        expect(result.current).toBe(true);
    });

    it('cleans up event listeners on unmount', async () => {
        const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
        const { unmount } = renderHook(() => useWindowVisibility());

        unmount();

        await act(async () => {
            await Promise.resolve();
        });

        expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
        expect(mockUnlisten).toHaveBeenCalledTimes(1);
    });
});
