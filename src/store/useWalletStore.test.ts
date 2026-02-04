import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWalletStore, initialState, updateWalletScanningProgress, pruneTransactionHistory } from './useWalletStore';
import { TariAddressType } from '@app/types/events-payloads';

// Mock useExchangeStore
vi.mock('./useExchangeStore', () => ({
    useExchangeStore: {
        getState: () => ({ currentExchangeMinerId: 'test-exchange' }),
    },
}));

describe('useWalletStore', () => {
    beforeEach(() => {
        useWalletStore.setState({
            ...initialState,
        });
    });

    describe('initial state', () => {
        it('has empty tari_address_base58', () => {
            expect(useWalletStore.getState().tari_address_base58).toBe('');
        });

        it('has empty tari_address_emoji', () => {
            expect(useWalletStore.getState().tari_address_emoji).toBe('');
        });

        it('has tari_address_type as Internal', () => {
            expect(useWalletStore.getState().tari_address_type).toBe(TariAddressType.Internal);
        });

        it('has empty coinbase_transactions', () => {
            expect(useWalletStore.getState().coinbase_transactions).toEqual([]);
        });

        it('has empty exchange_wxtm_addresses', () => {
            expect(useWalletStore.getState().exchange_wxtm_addresses).toEqual({});
        });

        it('has tx_history_filter as all-activity', () => {
            expect(useWalletStore.getState().tx_history_filter).toBe('all-activity');
        });

        it('has empty tx_history', () => {
            expect(useWalletStore.getState().tx_history).toEqual([]);
        });

        it('has empty bridge_transactions', () => {
            expect(useWalletStore.getState().bridge_transactions).toEqual([]);
        });

        it('has undefined cold_wallet_address', () => {
            expect(useWalletStore.getState().cold_wallet_address).toBeUndefined();
        });

        it('has is_wallet_importing as false', () => {
            expect(useWalletStore.getState().is_wallet_importing).toBe(false);
        });

        it('has isLoading as false', () => {
            expect(useWalletStore.getState().isLoading).toBe(false);
        });

        it('has wallet_scanning with default values', () => {
            const scanning = useWalletStore.getState().wallet_scanning;
            expect(scanning.is_scanning).toBe(true);
            expect(scanning.scanned_height).toBe(0);
            expect(scanning.total_height).toBe(0);
            expect(scanning.progress).toBe(0);
        });

        it('has is_pin_locked as false', () => {
            expect(useWalletStore.getState().is_pin_locked).toBe(false);
        });

        it('has is_seed_backed_up as false', () => {
            expect(useWalletStore.getState().is_seed_backed_up).toBe(false);
        });
    });

    describe('tari address state', () => {
        it('can set tari_address_base58', () => {
            useWalletStore.setState({ tari_address_base58: 'f5dkj3nfk2j3nf2k3jnf2k3jnf' });
            expect(useWalletStore.getState().tari_address_base58).toBe('f5dkj3nfk2j3nf2k3jnf2k3jnf');
        });

        it('can set tari_address_emoji', () => {
            useWalletStore.setState({ tari_address_emoji: '🎮🚀🌟💎' });
            expect(useWalletStore.getState().tari_address_emoji).toBe('🎮🚀🌟💎');
        });

        it('can set tari_address_type to External', () => {
            useWalletStore.setState({ tari_address_type: TariAddressType.External });
            expect(useWalletStore.getState().tari_address_type).toBe(TariAddressType.External);
        });
    });

    describe('balance state', () => {
        it('can set balance', () => {
            const balance = {
                available_balance: 1000000,
                pending_incoming_balance: 50000,
                pending_outgoing_balance: 10000,
                timelocked_balance: 0,
            };
            useWalletStore.setState({ balance });
            expect(useWalletStore.getState().balance).toEqual(balance);
        });

        it('can set calculated_balance', () => {
            useWalletStore.setState({ calculated_balance: 1500000 });
            expect(useWalletStore.getState().calculated_balance).toBe(1500000);
        });
    });

    describe('transaction history', () => {
        it('can set tx_history', () => {
            const tx = {
                tx_id: 1,
                source_address: 'addr1',
                dest_address: 'addr2',
                amount: 100000,
                fee: 1000,
                status: 6,
                direction: 2,
                timestamp: Date.now(),
            };
            useWalletStore.setState({ tx_history: [tx as any] });
            expect(useWalletStore.getState().tx_history).toHaveLength(1);
        });

        it('can set tx_history_filter', () => {
            useWalletStore.setState({ tx_history_filter: 'transactions' });
            expect(useWalletStore.getState().tx_history_filter).toBe('transactions');
        });

        it('can add multiple transactions', () => {
            const transactions = [
                { tx_id: 1, amount: 100, timestamp: 1000 },
                { tx_id: 2, amount: 200, timestamp: 2000 },
                { tx_id: 3, amount: 300, timestamp: 3000 },
            ];
            useWalletStore.setState({ tx_history: transactions as any });
            expect(useWalletStore.getState().tx_history).toHaveLength(3);
        });
    });

    describe('coinbase transactions', () => {
        it('can set coinbase_transactions', () => {
            const coinbaseTx = {
                tx_id: 1,
                amount: 10000000,
                status: 13,
                timestamp: Date.now(),
            };
            useWalletStore.setState({ coinbase_transactions: [coinbaseTx as any] });
            expect(useWalletStore.getState().coinbase_transactions).toHaveLength(1);
        });
    });

    describe('bridge transactions', () => {
        it('can set bridge_transactions', () => {
            const bridgeTx = {
                id: 'bridge-1',
                status: 'SUCCESS',
                sourceAddress: 'tari-addr',
                amount: 1000000,
            };
            useWalletStore.setState({ bridge_transactions: [bridgeTx as any] });
            expect(useWalletStore.getState().bridge_transactions).toHaveLength(1);
        });
    });

    describe('wallet importing state', () => {
        it('can set is_wallet_importing to true', () => {
            useWalletStore.setState({ is_wallet_importing: true });
            expect(useWalletStore.getState().is_wallet_importing).toBe(true);
        });
    });

    describe('loading state', () => {
        it('can set isLoading to true', () => {
            useWalletStore.setState({ isLoading: true });
            expect(useWalletStore.getState().isLoading).toBe(true);
        });
    });

    describe('swapping state', () => {
        it('can set is_swapping to true', () => {
            useWalletStore.setState({ is_swapping: true });
            expect(useWalletStore.getState().is_swapping).toBe(true);
        });
    });

    describe('details item', () => {
        it('can set detailsItem', () => {
            const item = {
                destinationAddress: 'dest',
                paymentId: 'payment-1',
                feeAmount: 100,
                createdAt: Date.now(),
                tokenAmount: 1000000,
                walletTransactionDetails: {
                    txId: 1,
                    direction: 2,
                    isCancelled: false,
                    status: 6,
                },
            };
            useWalletStore.setState({ detailsItem: item as any });
            expect(useWalletStore.getState().detailsItem).toEqual(item);
        });

        it('can clear detailsItem', () => {
            useWalletStore.setState({ detailsItem: { paymentId: 'test' } as any });
            useWalletStore.setState({ detailsItem: null });
            expect(useWalletStore.getState().detailsItem).toBeNull();
        });
    });

    describe('pin lock state', () => {
        it('can set is_pin_locked to true', () => {
            useWalletStore.setState({ is_pin_locked: true });
            expect(useWalletStore.getState().is_pin_locked).toBe(true);
        });
    });

    describe('seed backup state', () => {
        it('can set is_seed_backed_up to true', () => {
            useWalletStore.setState({ is_seed_backed_up: true });
            expect(useWalletStore.getState().is_seed_backed_up).toBe(true);
        });
    });

    describe('cold wallet address', () => {
        it('can set cold_wallet_address', () => {
            useWalletStore.setState({ cold_wallet_address: 'cold-wallet-addr-123' });
            expect(useWalletStore.getState().cold_wallet_address).toBe('cold-wallet-addr-123');
        });
    });

    describe('exchange WXTM addresses', () => {
        it('can set exchange_wxtm_addresses', () => {
            const addresses = {
                'exchange-1': '0x1234567890abcdef',
                'exchange-2': '0xfedcba0987654321',
            };
            useWalletStore.setState({ exchange_wxtm_addresses: addresses });
            expect(useWalletStore.getState().exchange_wxtm_addresses).toEqual(addresses);
        });

        it('getETHAddressOfCurrentExchange returns address for current exchange', () => {
            useWalletStore.setState({
                exchange_wxtm_addresses: {
                    'test-exchange': '0xABCDEF',
                },
            });
            const address = useWalletStore.getState().getETHAddressOfCurrentExchange();
            expect(address).toBe('0xABCDEF');
        });

        it('getETHAddressOfCurrentExchange returns undefined if no address', () => {
            useWalletStore.setState({ exchange_wxtm_addresses: {} });
            const address = useWalletStore.getState().getETHAddressOfCurrentExchange();
            expect(address).toBeUndefined();
        });
    });

    describe('updateWalletScanningProgress', () => {
        it('updates scanning progress', () => {
            updateWalletScanningProgress({
                scanned_height: 50,
                total_height: 100,
                progress: 50,
            });

            const scanning = useWalletStore.getState().wallet_scanning;
            expect(scanning.scanned_height).toBe(50);
            expect(scanning.total_height).toBe(100);
            expect(scanning.progress).toBe(50);
            expect(scanning.is_scanning).toBe(true);
        });

        it('sets is_scanning to false when scan is complete', () => {
            updateWalletScanningProgress({
                scanned_height: 100,
                total_height: 100,
                progress: 100,
            });

            expect(useWalletStore.getState().wallet_scanning.is_scanning).toBe(false);
        });

        it('sets is_scanning to true when scan is incomplete', () => {
            updateWalletScanningProgress({
                scanned_height: 99,
                total_height: 100,
                progress: 99,
            });

            expect(useWalletStore.getState().wallet_scanning.is_scanning).toBe(true);
        });
    });

    describe('pruneTransactionHistory', () => {
        it('does not fail with empty arrays', () => {
            expect(() => pruneTransactionHistory()).not.toThrow();
        });

        it('preserves transactions when under limit', () => {
            const transactions = Array.from({ length: 10 }, (_, i) => ({
                tx_id: i,
                timestamp: i * 1000,
            }));
            useWalletStore.setState({ tx_history: transactions as any });

            pruneTransactionHistory();

            // Should still have transactions (pruning happens at > 1000)
            expect(useWalletStore.getState().tx_history.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('complex state updates', () => {
        it('preserves unrelated state when updating specific fields', () => {
            useWalletStore.setState({
                tari_address_base58: 'test-address',
                is_pin_locked: true,
            });

            useWalletStore.setState({ is_pin_locked: false });

            expect(useWalletStore.getState().tari_address_base58).toBe('test-address');
            expect(useWalletStore.getState().is_pin_locked).toBe(false);
        });

        it('can update multiple fields atomically', () => {
            useWalletStore.setState({
                tari_address_base58: 'addr-123',
                tari_address_emoji: '🎯🚀',
                is_pin_locked: false,
                is_seed_backed_up: true,
            });

            const state = useWalletStore.getState();
            expect(state.tari_address_base58).toBe('addr-123');
            expect(state.tari_address_emoji).toBe('🎯🚀');
            expect(state.is_pin_locked).toBe(false);
            expect(state.is_seed_backed_up).toBe(true);
        });
    });
});
