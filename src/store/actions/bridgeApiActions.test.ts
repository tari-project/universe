import { describe, it, expect, beforeEach, vi } from 'vitest';

const getUserTransactions = vi.hoisted(() => vi.fn());
vi.mock('@tari-project/wxtm-bridge-backend-api', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@tari-project/wxtm-bridge-backend-api')>()),
    WrapTokenService: { getUserTransactions },
}));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

import { UserTransactionDTO } from '@tari-project/wxtm-bridge-backend-api';
import {
    DisplayedTransaction,
    TransactionDirection,
    TransactionDisplayStatus,
    TransactionSource,
} from '@app/types/app-status.ts';
import { useConfigBEInMemoryStore } from '../useAppConfigStore';
import { initialState, useWalletStore } from '../useWalletStore';
import { bridgeReference, fetchBridgeTransactionsHistory } from './bridgeApiActions';
import { handleWalletTransactionsFound } from './walletStoreActions';

const PAYMENT_ID = '9b2f4c1e-3a5d-4e6f-8a7b-1c2d3e4f5a6b';
const COLD_WALLET = 'cold-wallet';

const bridgeRow = (reference: string, tokenAmount = '5000'): UserTransactionDTO => ({
    reference,
    tokenAmount,
    amountAfterFee: '4985',
    feeAmount: '15',
    createdAt: '2026-11-10T10:00:00.000Z',
    transactionHash: '0xmint',
    status: UserTransactionDTO.status.SUCCESS,
    destinationAddress: '0x1',
});

const payment = (message: string | null, amount: number): DisplayedTransaction => ({
    id: 1,
    direction: TransactionDirection.Outgoing,
    source: TransactionSource.Transfer,
    status: TransactionDisplayStatus.Confirmed,
    amount,
    message,
    counterparty: COLD_WALLET,
    blockchain: { block_height: 1, timestamp: '2026-11-10T10:00:00', confirmations: 3, block_hash: [] },
    fee: null,
    details: {
        account_id: 0,
        total_credit: 0,
        total_debit: amount,
        inputs: [],
        outputs: [],
        output_type: null,
        coinbase_extra: null,
        memo_hex: null,
        sent_output_hashes: [],
        sent_payrefs: [],
    },
    lock_height: 0,
});

beforeEach(() => {
    getUserTransactions.mockReset();
    useWalletStore.setState({ ...initialState, tari_address_base58: 'me', cold_wallet_address: COLD_WALLET });
    useConfigBEInMemoryStore.setState({ bridge_backend_api_url: 'http://bridge' });
});

describe('bridgeReference', () => {
    it('matches the backend derivation', async () => {
        expect(await bridgeReference(PAYMENT_ID)).toBe('1ef58d2c1b5acd02');
    });
});

describe('fetchBridgeTransactionsHistory', () => {
    it('pages until the total is reached', async () => {
        getUserTransactions
            .mockResolvedValueOnce({ transactions: Array(100).fill(bridgeRow('a')), total: 150 })
            .mockResolvedValueOnce({ transactions: Array(50).fill(bridgeRow('b')), total: 150 });

        const rows = await fetchBridgeTransactionsHistory('me');

        expect(rows).toHaveLength(150);
        expect(getUserTransactions).toHaveBeenNthCalledWith(1, 'me');
        expect(getUserTransactions).toHaveBeenNthCalledWith(2, 'me', 100, 100);
        expect(useWalletStore.getState().bridge_transactions).toHaveLength(150);
    });
});

describe('bridge details on wallet payments (SEC-20)', () => {
    it('attaches the wrap whose reference derives from the payment message', async () => {
        getUserTransactions.mockResolvedValue({
            transactions: [bridgeRow(await bridgeReference(PAYMENT_ID), '7000')],
            total: 1,
        });

        await handleWalletTransactionsFound([payment(PAYMENT_ID, 9999)]);

        expect(useWalletStore.getState().wallet_transactions[0].bridge_transaction_details).toMatchObject({
            status: UserTransactionDTO.status.SUCCESS,
            transactionHash: '0xmint',
        });
    });

    it('does not refetch for a payment whose wrap is already known', async () => {
        useWalletStore.setState({ bridge_transactions: [bridgeRow(await bridgeReference(PAYMENT_ID), '5000')] });

        await handleWalletTransactionsFound([payment(PAYMENT_ID, 5000)]);

        expect(getUserTransactions).not.toHaveBeenCalled();
    });

    it('does not hash or wait for wallet events without a payment to the bridge', async () => {
        const digest = vi.spyOn(crypto.subtle, 'digest');

        await handleWalletTransactionsFound([{ ...payment(PAYMENT_ID, 5000), counterparty: 'someone-else' }]);

        expect(digest).not.toHaveBeenCalled();
        expect(getUserTransactions).not.toHaveBeenCalled();
        digest.mockRestore();
    });

    describe('against a backend from before references and paging', () => {
        const oldRow = (paymentId: string, tokenAmount = '5000') => {
            const { reference: _, ...row } = bridgeRow('unused', tokenAmount);
            return { ...row, paymentId } as unknown as UserTransactionDTO;
        };

        it('reads the history in one call', async () => {
            getUserTransactions.mockResolvedValue({ transactions: [oldRow(PAYMENT_ID)] });

            expect(await fetchBridgeTransactionsHistory('me')).toHaveLength(1);
            expect(getUserTransactions).toHaveBeenCalledTimes(1);
            expect(getUserTransactions).toHaveBeenCalledWith('me');
        });

        it('matches by paymentId, never a payment outside the bridge, and does not refetch a known wrap', async () => {
            useWalletStore.setState({ bridge_transactions: [oldRow(PAYMENT_ID)] });

            await handleWalletTransactionsFound([payment(PAYMENT_ID, 5000)]);
            expect(getUserTransactions).not.toHaveBeenCalled();

            getUserTransactions.mockResolvedValue({ transactions: [oldRow(PAYMENT_ID, '7000')] });
            await handleWalletTransactionsFound([
                { ...payment('another-id', 1), id: 2 },
                { ...payment('message-elsewhere', 2), id: 3, counterparty: 'someone-else' },
            ]);

            const details = useWalletStore
                .getState()
                .wallet_transactions.filter((tx) => tx.id !== 1)
                .map((tx) => tx.bridge_transaction_details);
            expect(details).toEqual([undefined, undefined]);
        });
    });
});
