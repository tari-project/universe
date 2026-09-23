import { invoke } from '@tauri-apps/api/core';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(),
}));

import { useCountdown } from './useCountdown';

describe('useCountdown', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.mocked(invoke).mockClear();
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('counts down one second at a time', () => {
        const { result } = renderHook(() => useCountdown());

        act(() => result.current.start(10));
        expect(result.current.seconds).toBe(10);

        act(() => void vi.advanceTimersByTime(3000));
        expect(result.current.seconds).toBe(7);
    });

    it('stops at zero rather than going negative', () => {
        const { result } = renderHook(() => useCountdown());

        act(() => result.current.start(2));
        act(() => void vi.advanceTimersByTime(10_000));

        expect(result.current.seconds).toBe(0);
    });

    it('does not run two intervals when start is called twice', () => {
        // DisconnectWrapper reaches this: on the `disconnected-severe` branch it
        // calls start(300) while the effect-driven start() is already running.
        // Without clearing the previous interval, both tick and the countdown
        // runs at double speed.
        const { result } = renderHook(() => useCountdown());

        act(() => result.current.start(60));
        act(() => result.current.start(60));
        act(() => void vi.advanceTimersByTime(1000));

        expect(result.current.seconds).toBe(59);
    });

    it('stops ticking after stop()', () => {
        const { result } = renderHook(() => useCountdown());

        act(() => result.current.start(30));
        act(() => void vi.advanceTimersByTime(1000));
        act(() => result.current.stop());
        act(() => void vi.advanceTimersByTime(5000));

        expect(result.current.seconds).toBe(29);
    });

    it('can be restarted after stop()', () => {
        const { result } = renderHook(() => useCountdown());

        act(() => result.current.start(30));
        act(() => result.current.stop());
        act(() => result.current.start(10));
        act(() => void vi.advanceTimersByTime(2000));

        expect(result.current.seconds).toBe(8);
    });

    it('fires reconnect once when start is called twice', () => {
        // The abandoned setTimeout still fires, so overlapping retries stack
        // reconnect attempts rather than replacing them.
        const { result } = renderHook(() => useCountdown());

        act(() => result.current.start(60));
        act(() => result.current.start(60));
        act(() => void vi.advanceTimersByTime(120_000));

        expect(vi.mocked(invoke)).toHaveBeenCalledTimes(1);
        expect(vi.mocked(invoke)).toHaveBeenCalledWith('reconnect');
    });

    it('does not fire reconnect after stop()', () => {
        const { result } = renderHook(() => useCountdown());

        act(() => result.current.start(60));
        act(() => result.current.stop());
        act(() => void vi.advanceTimersByTime(120_000));

        expect(vi.mocked(invoke)).not.toHaveBeenCalled();
    });
});
