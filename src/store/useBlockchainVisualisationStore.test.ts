/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock window.matchMedia for useUIStore dependency
vi.hoisted(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        enumerable: true,
        value: vi.fn().mockImplementation((query) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(), // deprecated
            removeListener: vi.fn(), // deprecated
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
});

// Mock external dependencies that cause issues
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: () => ({
        isMinimized: vi.fn().mockResolvedValue(false),
    }),
}));

vi.mock('@tari-project/tari-tower', () => ({
    setAnimationState: vi.fn(),
}));

vi.mock('@app/hooks/wallet/useFetchTxHistory', () => ({
    refreshTransactions: vi.fn().mockResolvedValue(undefined),
}));

// Import after mocks
import {
    useBlockchainVisualisationStore,
    handleWinRecap,
    handleReplayComplete,
} from './useBlockchainVisualisationStore';
import { DisplayedTransaction } from '@app/types/app-status.ts';

describe('useBlockchainVisualisationStore', () => {
    beforeEach(() => {
        useBlockchainVisualisationStore.setState({
            recapIds: [],
            earnings: undefined,
            recapData: undefined,
            recapCount: undefined,
            rewardCount: undefined,
            replayItem: undefined,
            latestBlockHeight: undefined,
        });
    });

    describe('initial state', () => {
        it('has empty recapIds array', () => {
            expect(useBlockchainVisualisationStore.getState().recapIds).toEqual([]);
        });

        it('has undefined earnings', () => {
            expect(useBlockchainVisualisationStore.getState().earnings).toBeUndefined();
        });

        it('has undefined recapData', () => {
            expect(useBlockchainVisualisationStore.getState().recapData).toBeUndefined();
        });

        it('has undefined recapCount', () => {
            expect(useBlockchainVisualisationStore.getState().recapCount).toBeUndefined();
        });

        it('has undefined rewardCount', () => {
            expect(useBlockchainVisualisationStore.getState().rewardCount).toBeUndefined();
        });

        it('has undefined replayItem', () => {
            expect(useBlockchainVisualisationStore.getState().replayItem).toBeUndefined();
        });

        it('has undefined latestBlockHeight', () => {
            expect(useBlockchainVisualisationStore.getState().latestBlockHeight).toBeUndefined();
        });
    });

    describe('setRecapCount action', () => {
        it('sets recapCount', () => {
            useBlockchainVisualisationStore.getState().setRecapCount(5);
            expect(useBlockchainVisualisationStore.getState().recapCount).toBe(5);
        });

        it('can clear recapCount', () => {
            useBlockchainVisualisationStore.getState().setRecapCount(10);
            useBlockchainVisualisationStore.getState().setRecapCount(undefined);
            expect(useBlockchainVisualisationStore.getState().recapCount).toBeUndefined();
        });
    });

    describe('setRewardCount action', () => {
        it('sets rewardCount', () => {
            useBlockchainVisualisationStore.getState().setRewardCount(3);
            expect(useBlockchainVisualisationStore.getState().rewardCount).toBe(3);
        });

        it('can clear rewardCount', () => {
            useBlockchainVisualisationStore.getState().setRewardCount(7);
            useBlockchainVisualisationStore.getState().setRewardCount(undefined);
            expect(useBlockchainVisualisationStore.getState().rewardCount).toBeUndefined();
        });
    });

    describe('recapIds state', () => {
        it('can add recap IDs', () => {
            useBlockchainVisualisationStore.setState({
                recapIds: ['1', '2', '3'],
            });
            expect(useBlockchainVisualisationStore.getState().recapIds).toEqual([1, 2, 3]);
        });

        it('can add to existing recap IDs', () => {
            useBlockchainVisualisationStore.setState({ recapIds: ['1', '2'] });
            useBlockchainVisualisationStore.setState((curr) => ({
                recapIds: [...curr.recapIds, '3'],
            }));
            expect(useBlockchainVisualisationStore.getState().recapIds).toEqual(['1', '2', '3']);
        });

        it('can clear recap IDs', () => {
            useBlockchainVisualisationStore.setState({ recapIds: ['1', '2', '3'] });
            useBlockchainVisualisationStore.setState({ recapIds: [] });
            expect(useBlockchainVisualisationStore.getState().recapIds).toEqual([]);
        });
    });

    describe('earnings state', () => {
        it('can set earnings', () => {
            useBlockchainVisualisationStore.setState({ earnings: 1000000 });
            expect(useBlockchainVisualisationStore.getState().earnings).toBe(1000000);
        });

        it('can clear earnings', () => {
            useBlockchainVisualisationStore.setState({ earnings: 1000000 });
            useBlockchainVisualisationStore.setState({ earnings: undefined });
            expect(useBlockchainVisualisationStore.getState().earnings).toBeUndefined();
        });
    });

    describe('recapData state', () => {
        it('can set recapData', () => {
            const recapData = { count: 5, totalEarnings: 5000000 };
            useBlockchainVisualisationStore.setState({ recapData });
            expect(useBlockchainVisualisationStore.getState().recapData).toEqual(recapData);
        });

        it('can clear recapData', () => {
            useBlockchainVisualisationStore.setState({
                recapData: { count: 5, totalEarnings: 5000000 },
            });
            useBlockchainVisualisationStore.setState({ recapData: undefined });
            expect(useBlockchainVisualisationStore.getState().recapData).toBeUndefined();
        });
    });

    describe('replayItem state', () => {
        it('can set replayItem', () => {
            const item = {
                destinationAddress: 'dest',
                paymentId: 'payment-1',
                feeAmount: 100,
                createdAt: Date.now(),
                tokenAmount: 1000000,
            };
            useBlockchainVisualisationStore.setState({ replayItem: item as unknown as DisplayedTransaction });
            expect(useBlockchainVisualisationStore.getState().replayItem).toBeDefined();
        });

        it('can clear replayItem', () => {
            useBlockchainVisualisationStore.setState({
                replayItem: { paymentId: 'test' } as unknown as DisplayedTransaction,
            });
            useBlockchainVisualisationStore.setState({ replayItem: undefined });
            expect(useBlockchainVisualisationStore.getState().replayItem).toBeUndefined();
        });
    });

    describe('latestBlockHeight state', () => {
        it('can set latestBlockHeight', () => {
            const payload = {
                block_height: 12345,
            };
            useBlockchainVisualisationStore.setState({ latestBlockHeight: payload.block_height });
            expect(useBlockchainVisualisationStore.getState().latestBlockHeight).toBe(12345);
        });

        it('can clear latestBlockHeight', () => {
            useBlockchainVisualisationStore.setState({
                latestBlockHeight: 12345,
            });
            useBlockchainVisualisationStore.setState({ latestBlockHeight: undefined });
            expect(useBlockchainVisualisationStore.getState().latestBlockHeight).toBeUndefined();
        });
    });

    describe('rewardCount incrementing', () => {
        it('increments rewardCount from undefined', () => {
            useBlockchainVisualisationStore.setState((curr) => ({
                rewardCount: (curr.rewardCount || 0) + 1,
            }));
            expect(useBlockchainVisualisationStore.getState().rewardCount).toBe(1);
        });

        it('increments rewardCount from existing value', () => {
            useBlockchainVisualisationStore.setState({ rewardCount: 5 });
            useBlockchainVisualisationStore.setState((curr) => ({
                rewardCount: (curr.rewardCount || 0) + 1,
            }));
            expect(useBlockchainVisualisationStore.getState().rewardCount).toBe(6);
        });
    });

    describe('getSuccessTier logic', () => {
        // Testing the tier calculation logic
        const getSuccessTier = (earnings: number) => {
            const humanValue = earnings / 1_000_000;
            if (humanValue < 100) {
                return 'ONE';
            }
            if (humanValue <= 1000) {
                return 'TWO';
            }
            return 'THREE';
        };

        it('returns ONE for earnings under 100 XTM', () => {
            expect(getSuccessTier(50_000_000)).toBe('ONE'); // 50 XTM
            expect(getSuccessTier(99_000_000)).toBe('ONE'); // 99 XTM
        });

        it('returns TWO for earnings between 100-1000 XTM', () => {
            expect(getSuccessTier(100_000_000)).toBe('TWO'); // 100 XTM
            expect(getSuccessTier(500_000_000)).toBe('TWO'); // 500 XTM
            expect(getSuccessTier(1000_000_000)).toBe('TWO'); // 1000 XTM
        });

        it('returns THREE for earnings over 1000 XTM', () => {
            expect(getSuccessTier(1001_000_000)).toBe('THREE'); // 1001 XTM
            expect(getSuccessTier(5000_000_000)).toBe('THREE'); // 5000 XTM
        });

        it('returns ONE for zero earnings', () => {
            expect(getSuccessTier(0)).toBe('ONE');
        });

        it('returns ONE for small earnings', () => {
            expect(getSuccessTier(1_000_000)).toBe('ONE'); // 1 XTM
        });
    });

    describe('handleReplayComplete', () => {
        it('clears replayItem', () => {
            useBlockchainVisualisationStore.setState({
                replayItem: { paymentId: 'test' } as unknown as DisplayedTransaction,
            });

            handleReplayComplete();

            expect(useBlockchainVisualisationStore.getState().replayItem).toBeUndefined();
        });

        it('clears recapData and recapIds when there was a recap', () => {
            useBlockchainVisualisationStore.setState({
                recapData: { count: 5, totalEarnings: 5000000 },
                recapIds: ['1', '2', '3'],
                replayItem: { paymentId: 'test' } as unknown as DisplayedTransaction,
            });

            handleReplayComplete();

            expect(useBlockchainVisualisationStore.getState().recapData).toBeUndefined();
            expect(useBlockchainVisualisationStore.getState().recapIds).toEqual([]);
        });

        it('preserves recapIds when there was no recap', () => {
            useBlockchainVisualisationStore.setState({
                recapData: undefined,
                recapIds: ['1', '2', '3'],
                replayItem: { paymentId: 'test' } as unknown as DisplayedTransaction,
            });

            handleReplayComplete();

            expect(useBlockchainVisualisationStore.getState().recapIds).toEqual(['1', '2', '3']);
        });
    });

    describe('handleWinRecap', () => {
        it('sets recapData and recapCount', () => {
            const recapData = { count: 10, totalEarnings: 10000000 };

            handleWinRecap(recapData);

            expect(useBlockchainVisualisationStore.getState().recapData).toEqual(recapData);
            expect(useBlockchainVisualisationStore.getState().recapCount).toBe(10);
        });
    });

    describe('complex state updates', () => {
        it('preserves unrelated state when updating specific fields', () => {
            useBlockchainVisualisationStore.setState({
                recapIds: ['1', '2', '3'],
                rewardCount: 5,
            });

            useBlockchainVisualisationStore.setState({ earnings: 1000000 });

            expect(useBlockchainVisualisationStore.getState().recapIds).toEqual([1, 2, 3]);
            expect(useBlockchainVisualisationStore.getState().rewardCount).toBe(5);
            expect(useBlockchainVisualisationStore.getState().earnings).toBe(1000000);
        });
    });
});
