import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

import {
    DisplayedTransaction,
    TransactionDirection,
    TransactionDisplayStatus,
    TransactionSource,
} from '@app/types/app-status.ts';
import { initialState, useWalletStore } from '../useWalletStore';
import { handleWalletTransactionsFound, importSeedWords } from './walletStoreActions';

function makeTransaction(id: number): DisplayedTransaction {
    return {
        id,
        direction: TransactionDirection.Incoming,
        source: TransactionSource.Transfer,
        status: TransactionDisplayStatus.Confirmed,
        amount: 1000,
        message: null,
        counterparty: `counterparty-${id}`,
        blockchain: { block_height: id, timestamp: '2026-09-23T00:00:00', confirmations: 3, block_hash: [] },
        fee: null,
        details: {
            account_id: 0,
            total_credit: 1000,
            total_debit: 0,
            inputs: [],
            outputs: [],
            output_type: null,
            coinbase_extra: null,
            memo_hex: null,
            sent_output_hashes: [],
            sent_payrefs: [],
        },
        lock_height: 0,
    };
}

describe('importSeedWords', () => {
    beforeEach(() => {
        useWalletStore.setState({ ...initialState });
        vi.mocked(invoke).mockReset().mockResolvedValue(undefined);
    });

    it('drops the previous wallet history so only the imported wallet is listed', async () => {
        const walletA = makeTransaction(1);
        useWalletStore.setState({ wallet_transactions: [walletA], selectedTransactionId: walletA.id });

        await importSeedWords(['seed', 'words']);

        expect(invoke).toHaveBeenCalledWith('import_seed_words', { seedWords: ['seed', 'words'] });
        expect(useWalletStore.getState().wallet_transactions).toEqual([]);
        expect(useWalletStore.getState().selectedTransactionId).toBeNull();
        expect(useWalletStore.getState().is_wallet_importing).toBe(false);

        const walletB = makeTransaction(2);
        await handleWalletTransactionsFound([walletB]);

        expect(useWalletStore.getState().wallet_transactions).toEqual([walletB]);
    });

    it('keeps the history when the import fails', async () => {
        const walletA = makeTransaction(1);
        vi.mocked(invoke).mockRejectedValue('User canceled the operation');

        useWalletStore.setState({ wallet_transactions: [walletA] });
        await importSeedWords(['seed']);

        await handleWalletTransactionsFound([walletA]);
        expect(useWalletStore.getState().wallet_transactions).toEqual([walletA]);
    });
});
