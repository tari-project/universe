import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render } from '@app/test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockInvoke = vi.fn();
const mockReadText = vi.fn();
const mockValidateAddress = vi.fn();
const mockHandleAirdropRequest = vi.fn();
const FIXED_BLOCK_TIMESTAMP_SEC = 1_700_000_000;

vi.mock('@tauri-apps/api/core', () => ({
    invoke: (...args: unknown[]) => mockInvoke(...args),
}));

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: () => ({
        isMinimized: vi.fn().mockResolvedValue(false),
    }),
}));

vi.mock('@tari-project/tari-tower', () => ({
    setAnimationState: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({
    readText: () => mockReadText(),
}));

vi.mock('@app/hooks/wallet/useValidate.ts', () => ({
    useValidateTariAddress: () => ({
        validateAddress: mockValidateAddress,
    }),
}));

vi.mock('@app/hooks/airdrop/utils/useHandleRequest', () => ({
    handleAirdropRequest: (...args: unknown[]) => mockHandleAirdropRequest(...args),
}));

vi.mock('@app/hooks/mining/useBlockTip.ts', () => ({
    useBlockTip: () => ({
        data: { height: 100, timestamp: FIXED_BLOCK_TIMESTAMP_SEC },
        isLoading: false,
    }),
}));

import { useFetchExplorerData, KEY_EXPLORER, KEY_STATS } from './useFetchExplorerData';
import useBlockTime from './useBlockTime';
import { ClipboardViewer } from '@app/components/exchanges/universal/clipboardViewer/ClipboardViewer';
import { useIframeUrl } from '@app/hooks/swap/useIframeUrl';
import useResumeCountdown from '@app/containers/navigation/components/MiningButtonCombined/useResumeCountdown';
import { useConfigUIStore, useMiningStore } from '@app/store';

describe('polling and 1-second timer fixes (#3373)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime((FIXED_BLOCK_TIMESTAMP_SEC + 65) * 1000);
        vi.clearAllMocks();
        mockInvoke.mockResolvedValue([]);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('handles empty explorer array without throwing on data[0].height', () => {
        useConfigUIStore.setState({ visual_mode: true });

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });
        queryClient.setQueryData([KEY_EXPLORER, KEY_STATS, 10], []);

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result, unmount } = renderHook(() => useFetchExplorerData(), { wrapper });
        expect(result.current.blockBubblesData).toEqual([]);
        unmount();
    });

    it('shares a single interval across multiple useBlockTime consumers', () => {
        const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
        const first = renderHook(() => useBlockTime());
        const second = renderHook(() => useBlockTime());
        const third = renderHook(() => useBlockTime());

        expect(setIntervalSpy).toHaveBeenCalledTimes(1);
        expect(first.result.current.currentTimeShort).toBe('01:05');
        expect(second.result.current.currentTimeShort).toBe('01:05');

        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(first.result.current.currentTimeShort).toBe('01:06');
        expect(third.result.current.currentTimeShort).toBe('01:06');

        first.unmount();
        second.unmount();
        third.unmount();
    });

    it('skips overlapping and duplicate clipboard validations in ClipboardViewer', async () => {
        mockReadText.mockResolvedValue('valid-tari-address');
        mockValidateAddress.mockResolvedValue(true);

        const { unmount } = render(<ClipboardViewer handlePaste={vi.fn()} />);
        await act(async () => {
            await Promise.resolve();
        });
        expect(mockValidateAddress).toHaveBeenCalledTimes(1);

        // Next 1s ticks with identical clipboard text should not re-invoke validateAddress
        await act(async () => {
            vi.advanceTimersByTime(3000);
        });
        expect(mockValidateAddress).toHaveBeenCalledTimes(1);

        unmount();
    });

    it('backs off swaps url retries in useIframeUrl instead of polling every second forever', async () => {
        mockHandleAirdropRequest.mockResolvedValue(null);

        const { unmount } = renderHook(() => useIframeUrl());
        await act(async () => {
            await Promise.resolve();
        });
        expect(mockHandleAirdropRequest).toHaveBeenCalledTimes(1);

        // At 1000ms no retry has fired yet because initial backoff is 2000ms
        await act(async () => {
            vi.advanceTimersByTime(1000);
        });
        expect(mockHandleAirdropRequest).toHaveBeenCalledTimes(1);

        await act(async () => {
            vi.advanceTimersByTime(1000);
        });
        expect(mockHandleAirdropRequest).toHaveBeenCalledTimes(2);

        unmount();
    });

    it('does not start a 1-second interval in useResumeCountdown when no resume duration is scheduled', () => {
        useMiningStore.setState({ selectedResumeDuration: undefined });
        const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');

        const { result, unmount } = renderHook(() => useResumeCountdown());
        expect(result.current.displayString).toBeUndefined();
        expect(setIntervalSpy).not.toHaveBeenCalled();

        unmount();
    });
});
