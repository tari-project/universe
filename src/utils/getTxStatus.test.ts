import { describe, it, expect, vi } from 'vitest';
import { TransactionDirection, TransactionStatus } from '@app/types/transactions';

// Mock i18next
vi.mock('i18next', () => ({
    default: {
        t: (key: string) => {
            const translations: Record<string, string> = {
                'common:complete': 'Complete',
                'common:pending': 'Pending',
                'common:failed': 'Failed',
                'common:mined': 'Mined',
                'common:received': 'Received',
                'common:sent': 'Sent',
                'common:unknown': 'Unknown',
                'sidebar:block': 'Block',
            };
            return translations[key] || key;
        },
    },
    t: (key: string) => {
        const translations: Record<string, string> = {
            'common:complete': 'Complete',
            'common:pending': 'Pending',
            'common:failed': 'Failed',
            'common:mined': 'Mined',
            'common:received': 'Received',
            'common:sent': 'Sent',
            'common:unknown': 'Unknown',
            'sidebar:block': 'Block',
        };
        return translations[key] || key;
    },
}));

// Mock the bridge API types
vi.mock('@tari-project/wxtm-bridge-backend-api', () => ({
    UserTransactionDTO: {
        status: {
            SUCCESS: 'SUCCESS',
            PENDING: 'PENDING',
            FAILED: 'FAILED',
        },
    },
}));

// Import after mocks
import { getTxTypeByStatus, getTxStatusTitleKey, getTxTitle } from './getTxStatus';
import type { CombinedBridgeWalletTransaction } from '@app/store';

// Helper to create mock transactions
function createMockTransaction(
    overrides: Partial<{
        status: TransactionStatus;
        direction: TransactionDirection;
        paymentId: string;
        mined_in_block_height: number;
        bridgeTransactionDetails: { status: string } | undefined;
    }> = {}
): CombinedBridgeWalletTransaction {
    return {
        destinationAddress: 'dest_addr',
        paymentId: overrides.paymentId ?? '',
        feeAmount: 1000,
        createdAt: Date.now(),
        tokenAmount: 1000000,
        mined_in_block_height: overrides.mined_in_block_height,
        sourceAddress: 'source_addr',
        walletTransactionDetails: {
            status: overrides.status ?? TransactionStatus.Completed,
            direction: overrides.direction ?? TransactionDirection.Inbound,
            tx_id: '123',
            amount: 1000000,
            fee: 1000,
            timestamp: Date.now(),
            message: '',
        },
        bridgeTransactionDetails: overrides.bridgeTransactionDetails,
    } as unknown as CombinedBridgeWalletTransaction;
}

describe('getTxStatus utilities', () => {
    describe('getTxTypeByStatus', () => {
        describe('mined transactions', () => {
            it('returns "mined" for CoinbaseConfirmed status', () => {
                const tx = createMockTransaction({ status: TransactionStatus.CoinbaseConfirmed });
                expect(getTxTypeByStatus(tx)).toBe('mined');
            });

            it('returns "mined" for CoinbaseUnconfirmed status', () => {
                const tx = createMockTransaction({ status: TransactionStatus.CoinbaseUnconfirmed });
                expect(getTxTypeByStatus(tx)).toBe('mined');
            });
        });

        describe('one-sided transactions - inbound (received)', () => {
            it('returns "received" for OneSidedConfirmed inbound', () => {
                const tx = createMockTransaction({
                    status: TransactionStatus.OneSidedConfirmed,
                    direction: TransactionDirection.Inbound,
                });
                expect(getTxTypeByStatus(tx)).toBe('received');
            });

            it('returns "received" for OneSidedUnconfirmed inbound', () => {
                const tx = createMockTransaction({
                    status: TransactionStatus.OneSidedUnconfirmed,
                    direction: TransactionDirection.Inbound,
                });
                expect(getTxTypeByStatus(tx)).toBe('received');
            });

            it('returns "received" for MinedConfirmed inbound', () => {
                const tx = createMockTransaction({
                    status: TransactionStatus.MinedConfirmed,
                    direction: TransactionDirection.Inbound,
                });
                expect(getTxTypeByStatus(tx)).toBe('received');
            });

            it('returns "received" for MinedUnconfirmed inbound', () => {
                const tx = createMockTransaction({
                    status: TransactionStatus.MinedUnconfirmed,
                    direction: TransactionDirection.Inbound,
                });
                expect(getTxTypeByStatus(tx)).toBe('received');
            });
        });

        describe('one-sided transactions - outbound (sent)', () => {
            it('returns "sent" for OneSidedConfirmed outbound', () => {
                const tx = createMockTransaction({
                    status: TransactionStatus.OneSidedConfirmed,
                    direction: TransactionDirection.Outbound,
                });
                expect(getTxTypeByStatus(tx)).toBe('sent');
            });

            it('returns "sent" for OneSidedUnconfirmed outbound', () => {
                const tx = createMockTransaction({
                    status: TransactionStatus.OneSidedUnconfirmed,
                    direction: TransactionDirection.Outbound,
                });
                expect(getTxTypeByStatus(tx)).toBe('sent');
            });

            it('returns "sent" for MinedConfirmed outbound', () => {
                const tx = createMockTransaction({
                    status: TransactionStatus.MinedConfirmed,
                    direction: TransactionDirection.Outbound,
                });
                expect(getTxTypeByStatus(tx)).toBe('sent');
            });

            it('returns "sent" for MinedUnconfirmed outbound', () => {
                const tx = createMockTransaction({
                    status: TransactionStatus.MinedUnconfirmed,
                    direction: TransactionDirection.Outbound,
                });
                expect(getTxTypeByStatus(tx)).toBe('sent');
            });
        });

        describe('unknown transactions', () => {
            it('returns "unknown" for Completed status', () => {
                const tx = createMockTransaction({ status: TransactionStatus.Completed });
                expect(getTxTypeByStatus(tx)).toBe('unknown');
            });

            it('returns "unknown" for Pending status', () => {
                const tx = createMockTransaction({ status: TransactionStatus.Pending });
                expect(getTxTypeByStatus(tx)).toBe('unknown');
            });

            it('returns "unknown" for Broadcast status', () => {
                const tx = createMockTransaction({ status: TransactionStatus.Broadcast });
                expect(getTxTypeByStatus(tx)).toBe('unknown');
            });

            it('returns "unknown" for Rejected status', () => {
                const tx = createMockTransaction({ status: TransactionStatus.Rejected });
                expect(getTxTypeByStatus(tx)).toBe('unknown');
            });

            it('returns "unknown" for Queued status', () => {
                const tx = createMockTransaction({ status: TransactionStatus.Queued });
                expect(getTxTypeByStatus(tx)).toBe('unknown');
            });
        });
    });

    describe('getTxStatusTitleKey', () => {
        describe('bridge transactions', () => {
            it('returns "complete" for SUCCESS bridge transaction', () => {
                const tx = createMockTransaction({
                    bridgeTransactionDetails: { status: 'SUCCESS' },
                });
                expect(getTxStatusTitleKey(tx)).toBe('complete');
            });

            it('returns "pending" for non-SUCCESS bridge transaction', () => {
                const tx = createMockTransaction({
                    bridgeTransactionDetails: { status: 'PENDING' },
                });
                expect(getTxStatusTitleKey(tx)).toBe('pending');
            });

            it('returns "pending" for FAILED bridge transaction', () => {
                const tx = createMockTransaction({
                    bridgeTransactionDetails: { status: 'FAILED' },
                });
                expect(getTxStatusTitleKey(tx)).toBe('pending');
            });
        });

        describe('pending wallet transactions', () => {
            it('returns "pending" for Completed status', () => {
                const tx = createMockTransaction({ status: TransactionStatus.Completed });
                expect(getTxStatusTitleKey(tx)).toBe('pending');
            });

            it('returns "pending" for Pending status', () => {
                const tx = createMockTransaction({ status: TransactionStatus.Pending });
                expect(getTxStatusTitleKey(tx)).toBe('pending');
            });

            it('returns "pending" for Broadcast status', () => {
                const tx = createMockTransaction({ status: TransactionStatus.Broadcast });
                expect(getTxStatusTitleKey(tx)).toBe('pending');
            });

            it('returns "pending" for Coinbase status', () => {
                const tx = createMockTransaction({ status: TransactionStatus.Coinbase });
                expect(getTxStatusTitleKey(tx)).toBe('pending');
            });

            it('returns "pending" for Queued status', () => {
                const tx = createMockTransaction({ status: TransactionStatus.Queued });
                expect(getTxStatusTitleKey(tx)).toBe('pending');
            });
        });

        describe('failed wallet transactions', () => {
            it('returns "failed" for Rejected status', () => {
                const tx = createMockTransaction({ status: TransactionStatus.Rejected });
                expect(getTxStatusTitleKey(tx)).toBe('failed');
            });

            it('returns "failed" for NotFound status', () => {
                const tx = createMockTransaction({ status: TransactionStatus.NotFound });
                expect(getTxStatusTitleKey(tx)).toBe('failed');
            });

            it('returns "failed" for CoinbaseNotInBlockChain status', () => {
                const tx = createMockTransaction({ status: TransactionStatus.CoinbaseNotInBlockChain });
                expect(getTxStatusTitleKey(tx)).toBe('failed');
            });
        });

        describe('complete wallet transactions', () => {
            it('returns "complete" for Imported status', () => {
                const tx = createMockTransaction({ status: TransactionStatus.Imported });
                expect(getTxStatusTitleKey(tx)).toBe('complete');
            });

            it('returns "complete" for OneSidedUnconfirmed status', () => {
                const tx = createMockTransaction({ status: TransactionStatus.OneSidedUnconfirmed });
                expect(getTxStatusTitleKey(tx)).toBe('complete');
            });

            it('returns "complete" for OneSidedConfirmed status', () => {
                const tx = createMockTransaction({ status: TransactionStatus.OneSidedConfirmed });
                expect(getTxStatusTitleKey(tx)).toBe('complete');
            });

            it('returns "complete" for MinedConfirmed status', () => {
                const tx = createMockTransaction({ status: TransactionStatus.MinedConfirmed });
                expect(getTxStatusTitleKey(tx)).toBe('complete');
            });

            it('returns "complete" for MinedUnconfirmed status', () => {
                const tx = createMockTransaction({ status: TransactionStatus.MinedUnconfirmed });
                expect(getTxStatusTitleKey(tx)).toBe('complete');
            });

            it('returns "complete" for CoinbaseConfirmed status', () => {
                const tx = createMockTransaction({ status: TransactionStatus.CoinbaseConfirmed });
                expect(getTxStatusTitleKey(tx)).toBe('complete');
            });

            it('returns "complete" for CoinbaseUnconfirmed status', () => {
                const tx = createMockTransaction({ status: TransactionStatus.CoinbaseUnconfirmed });
                expect(getTxStatusTitleKey(tx)).toBe('complete');
            });
        });
    });

    describe('getTxTitle', () => {
        describe('bridge transactions', () => {
            it('returns bridge title for bridge transaction', () => {
                const tx = createMockTransaction({
                    bridgeTransactionDetails: { status: 'SUCCESS' },
                });
                expect(getTxTitle(tx)).toBe('Bridge XTM to WXTM');
            });
        });

        describe('mined transactions', () => {
            it('returns block number for mined transaction with block height', () => {
                const tx = createMockTransaction({
                    status: TransactionStatus.CoinbaseConfirmed,
                    mined_in_block_height: 12345,
                });
                expect(getTxTitle(tx)).toBe('Block #12345');
            });
        });

        describe('transactions with payment ID', () => {
            it('returns payment ID for complete transaction', () => {
                const tx = createMockTransaction({
                    status: TransactionStatus.OneSidedConfirmed,
                    paymentId: 'Test Payment',
                });
                expect(getTxTitle(tx)).toBe('Test Payment');
            });

            it('returns payment ID with status for pending transaction', () => {
                const tx = createMockTransaction({
                    status: TransactionStatus.Pending,
                    paymentId: 'Test Payment',
                });
                expect(getTxTitle(tx)).toBe('Test Payment | Pending');
            });

            it('ignores <No message> payment ID', () => {
                const tx = createMockTransaction({
                    status: TransactionStatus.OneSidedConfirmed,
                    direction: TransactionDirection.Inbound,
                    paymentId: '<No message>',
                });
                // i18n.t returns 'Received' from our mock translation
                expect(getTxTitle(tx)).toBe('Received');
            });
        });

        describe('transactions without payment ID', () => {
            it('returns type for complete received transaction', () => {
                const tx = createMockTransaction({
                    status: TransactionStatus.OneSidedConfirmed,
                    direction: TransactionDirection.Inbound,
                });
                // i18n.t returns 'Received' from our mock translation
                expect(getTxTitle(tx)).toBe('Received');
            });

            it('returns type for complete sent transaction', () => {
                const tx = createMockTransaction({
                    status: TransactionStatus.OneSidedConfirmed,
                    direction: TransactionDirection.Outbound,
                });
                // i18n.t returns 'Sent' from our mock translation
                expect(getTxTitle(tx)).toBe('Sent');
            });

            it('returns type with status for pending transaction', () => {
                const tx = createMockTransaction({
                    status: TransactionStatus.Pending,
                    direction: TransactionDirection.Inbound,
                });
                expect(getTxTitle(tx)).toBe('Inbound | Pending');
            });

            it('returns type with status for failed transaction', () => {
                const tx = createMockTransaction({
                    status: TransactionStatus.Rejected,
                    direction: TransactionDirection.Outbound,
                });
                expect(getTxTitle(tx)).toBe('Outbound | Failed');
            });
        });
    });
});
