import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: () => ({
        isMinimized: vi.fn().mockResolvedValue(false),
    }),
}));

const mockListen = vi.fn();
const mockInvoke = vi.fn();

vi.mock('@tauri-apps/api/event', () => ({
    listen: (...args: unknown[]) => mockListen(...args),
}));

vi.mock('@tauri-apps/api/core', () => ({
    invoke: (...args: unknown[]) => mockInvoke(...args),
}));

const mockSetAnimationState = vi.fn();
const mockGetCurrentAnimationState = vi.fn(() => 'RUNNING');

vi.mock('@tari-project/tari-tower', () => ({
    setAnimationState: (...args: unknown[]) => mockSetAnimationState(...args),
    getCurrentAnimationState: () => mockGetCurrentAnimationState(),
    getTowerLogPrefix: (level: string) => `[tower:${level}]`,
}));

const mockHandleTrancheRefresh = vi.fn(async () => true);

vi.mock('@app/hooks/airdrop/stateHelpers/useAirdropTokensRefresh', () => ({
    handleTrancheRefresh: () => mockHandleTrancheRefresh(),
}));

const mockFetchFeatures = vi.fn(async () => undefined);
const mockFetchCommunityMessages = vi.fn(async () => undefined);
const mockFetchAllUserData = vi.fn(async () => undefined);
const mockFetchLatestXSpaceEvent = vi.fn(async () => undefined);

vi.mock('@app/store/actions/airdropStoreActions', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@app/store/actions/airdropStoreActions')>();
    return {
        ...actual,
        fetchFeatures: () => mockFetchFeatures(),
        fetchCommunityMessages: () => mockFetchCommunityMessages(),
        fetchAllUserData: () => mockFetchAllUserData(),
        fetchLatestXSpaceEvent: () => mockFetchLatestXSpaceEvent(),
    };
});

import useTauriEventsListener from '@app/hooks/app/useTauriEventsListener';
import { useUiMiningStateMachine } from '@app/hooks/mining/useMiningUiStateMachine';
import useEarningsRecap from '@app/hooks/mining/useEarningsRecap';
import { useAirdropPolling } from '@app/hooks/airdrop/stateHelpers/useAirdropPolling';
import { useAutomaticOtpClaim } from '@app/hooks/airdrop/claim/useAutomaticOtpClaim';
import {
    useTrancheAutoRefresh,
    resetTrancheAutoRefreshStateForTests,
} from '@app/hooks/airdrop/tranches/useTrancheAutoRefresh';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore';
import { useWalletStore } from '@app/store/useWalletStore';
import { useAirdropStore, useConfigUIStore, useUIStore } from '@app/store';
import { useMiningStore } from '@app/store/useMiningStore';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore';

describe('timer and listener lifecycle fixes (#3373)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        resetTrancheAutoRefreshStateForTests();
        mockListen.mockImplementation(async () => vi.fn());
        mockInvoke.mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('cleans up BACKEND_STATE_UPDATE when unmounted while listen is pending and re-registers on remount', async () => {
        let resolveFirstListen!: (unlisten: () => void) => void;
        const firstUnlisten = vi.fn();
        const secondUnlisten = vi.fn();

        mockListen
            .mockImplementationOnce(
                () =>
                    new Promise<() => void>((resolve) => {
                        resolveFirstListen = resolve;
                    })
            )
            .mockResolvedValueOnce(secondUnlisten);

        const first = renderHook(() => useTauriEventsListener());
        first.unmount();

        const second = renderHook(() => useTauriEventsListener());
        expect(mockListen).toHaveBeenCalledTimes(2);

        await act(async () => {
            resolveFirstListen(firstUnlisten);
            await Promise.resolve();
        });

        // The first mount was unmounted before listen resolved, so its late unlisten is called immediately
        expect(firstUnlisten).toHaveBeenCalledTimes(1);
        expect(secondUnlisten).not.toHaveBeenCalled();

        second.unmount();
        expect(secondUnlisten).toHaveBeenCalledTimes(1);
    });

    it('cancels pending stop retry timers in useUiMiningStateMachine on start or unmount', () => {
        useConfigUIStore.setState({ visual_mode: true, visualModeToggleLoading: false });
        useUIStore.setState({ towerInitalized: true });
        useMiningStore.setState({ isCpuMiningInitiated: false, isGpuMiningInitiated: false, isChangingMode: false });
        useMiningMetricsStore.setState({
            cpu_mining_status: {
                is_mining: false,
                hash_rate: 0,
                estimated_earnings: 0,
                connection: { is_connected: false },
            },
            gpu_mining_status: { is_mining: false, hash_rate: 0, estimated_earnings: 0, is_available: true },
        });
        mockGetCurrentAnimationState.mockReturnValue('RUNNING');

        const { unmount } = renderHook(() => useUiMiningStateMachine());

        act(() => {
            vi.advanceTimersByTime(2500);
        });
        expect(mockSetAnimationState).toHaveBeenCalledWith('stop');
        const callsBeforeUnmount = mockSetAnimationState.mock.calls.length;

        unmount();
        act(() => {
            vi.advanceTimersByTime(5000);
        });
        expect(mockSetAnimationState).toHaveBeenCalledTimes(callsBeforeUnmount);
    });

    it('only registers tauri://focus in useEarningsRecap when recapIds exist and does not re-subscribe on wallet_transactions updates', async () => {
        useBlockchainVisualisationStore.setState({ recapIds: [] });
        const { rerender, unmount } = renderHook(() => useEarningsRecap());

        expect(mockListen).not.toHaveBeenCalled();

        act(() => {
            useBlockchainVisualisationStore.setState({ recapIds: [1] });
        });
        rerender();
        await act(async () => {
            await Promise.resolve();
        });

        expect(mockListen).toHaveBeenCalledTimes(1);

        act(() => {
            useWalletStore.setState({ wallet_transactions: [] });
        });
        rerender();
        expect(mockListen).toHaveBeenCalledTimes(1);

        unmount();
    });

    it('clears featureFlagTimeoutRef after firing in useAirdropPolling so subsequent intervals keep refreshing', async () => {
        useAirdropStore.setState({ features: [] });
        const { unmount } = renderHook(() => useAirdropPolling());

        // Initial immediate fetch
        expect(mockFetchFeatures).toHaveBeenCalledTimes(1);

        await act(async () => {
            vi.advanceTimersByTime(60_000);
        });
        expect(mockFetchFeatures).toHaveBeenCalledTimes(2);

        await act(async () => {
            vi.advanceTimersByTime(60_000);
        });
        expect(mockFetchFeatures).toHaveBeenCalledTimes(3);

        unmount();
    });

    it('cleans up previous ws-rx listener in useAutomaticOtpClaim when requestOtp is called again', async () => {
        useWalletStore.setState({ tari_address_base58: 'base58-addr' });
        useAirdropStore.setState({
            airdropTokens: { token: 'jwt-token', refreshToken: 'refresh-token' },
        });

        const unlistenFirst = vi.fn();
        const unlistenSecond = vi.fn();
        mockListen.mockResolvedValueOnce(unlistenFirst).mockResolvedValueOnce(unlistenSecond);

        const { result, unmount } = renderHook(() => useAutomaticOtpClaim());

        await act(async () => {
            await result.current.requestOtp('csrf-1');
        });
        expect(unlistenFirst).not.toHaveBeenCalled();

        await act(async () => {
            await result.current.requestOtp('csrf-2');
        });
        expect(unlistenFirst).toHaveBeenCalledTimes(1);
        expect(unlistenSecond).not.toHaveBeenCalled();

        unmount();
        expect(unlistenSecond).toHaveBeenCalledTimes(1);
    });

    it('coalesces simultaneous focus and visibilitychange tranche refreshes across multiple mounted hooks', async () => {
        useAirdropStore.setState({
            userDetails: {
                user: {
                    is_bot: false,
                    twitter_followers: 10,
                    id: 'user-1',
                    referral_code: 'REF1',
                    yat_user_id: 'yat-1',
                    name: 'Test',
                    role: 'miner',
                    image_url: '',
                    rank: {
                        gems: 0,
                        shells: 0,
                        hammers: 0,
                        totalScore: 0,
                        rank: 'Bronze',
                    },
                },
            },
        });

        const queryClient = new QueryClient();
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const first = renderHook(() => useTrancheAutoRefresh({ enabled: true, notifyOnNewTranches: false }), {
            wrapper,
        });
        const second = renderHook(() => useTrancheAutoRefresh({ enabled: true, notifyOnNewTranches: false }), {
            wrapper,
        });

        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            get: () => 'visible',
        });

        await act(async () => {
            window.dispatchEvent(new Event('focus'));
            document.dispatchEvent(new Event('visibilitychange'));
            await Promise.resolve();
        });

        expect(mockHandleTrancheRefresh).toHaveBeenCalledTimes(1);

        first.unmount();
        second.unmount();
    });
});
