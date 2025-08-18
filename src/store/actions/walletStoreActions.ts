import { invoke } from '@tauri-apps/api/core';
import { WalletBalance } from '@app/types/app-status.ts';
import { CombinedBridgeWalletTransaction, useWalletStore } from '../useWalletStore';
import { setError } from './appStateStoreActions';
import { TxHistoryFilter } from '@app/components/transactions/history/FilterSelect';

import { TariAddressUpdatePayload } from '@app/types/events-payloads';
import { addToast } from '@app/components/ToastStack/useToastStore';
import { t } from 'i18next';
import { startMining, stopMining } from './miningStoreActions';
import { useMiningStore } from '../useMiningStore';

// NOTE: Tx status differ for core and proto(grpc)
export const COINBASE_BITFLAG = 6144;
export const NON_COINBASE_BITFLAG = 2015;

export interface TxArgs {
    filter?: TxHistoryFilter;
    offset?: number;
    limit?: number;
}

const filterToBitflag = (filter: TxHistoryFilter): number => {
    switch (filter) {
        case 'transactions':
            return NON_COINBASE_BITFLAG;
        case 'rewards':
            return COINBASE_BITFLAG;
        default:
            return COINBASE_BITFLAG | NON_COINBASE_BITFLAG;
    }
};

export const fetchTransactionsHistory = async ({ offset = 0, limit, filter = 'all-activity' }: TxArgs) => {
    const bitflag = filterToBitflag(filter);
    try {
        return await invoke('get_transactions', { offset, limit, statusBitflag: bitflag });
    } catch (error) {
        console.error(`Could not get transaction history for rewards: `, error);
        return [];
    }
};

export const fetchCoinbaseTransactions = async ({ offset = 0, limit }: Omit<TxArgs, 'filter'>) => {
    const bitflag = filterToBitflag('rewards');
    try {
        const currentTxs = useWalletStore.getState().coinbase_transactions;
        const fetchedTxs = await invoke('get_transactions', { offset, limit, statusBitflag: bitflag });

        const coinbase_transactions = offset > 0 ? [...currentTxs, ...fetchedTxs] : fetchedTxs;
        useWalletStore.setState((c) => ({ ...c, coinbase_transactions: coinbase_transactions }));
        return coinbase_transactions;
    } catch (error) {
        console.error(`Could not get transaction history for rewards: `, error);
        return [];
    }
};

export const importSeedWords = async (seedWords: string[]) => {
    useWalletStore.setState((c) => ({
        ...c,
        is_wallet_importing: true,
        coinbase_transactions: [],
        tx_history: [],
        bridge_transactions: [],
        wallet_scanning: {
            is_scanning: true,
            scanned_height: 0,
            total_height: 0,
            progress: 0,
        },
    }));

    const anyMiningInitiated =
        useMiningStore.getState().isCpuMiningInitiated || useMiningStore.getState().isGpuMiningInitiated;

    try {
        if (anyMiningInitiated) {
            await stopMining();
        }
        await invoke('import_seed_words', { seedWords });
        await refreshTransactions();
        useWalletStore.setState((c) => ({ ...c, is_wallet_importing: false }));
        addToast({
            title: t('success', { ns: 'airdrop' }),
            text: t('import-seed-success', { ns: 'settings' }),
            type: 'success',
        });
        if (anyMiningInitiated) {
            await startMining();
        }
    } catch (error) {
        const errorMessage = error as unknown as string;
        if (!errorMessage.includes('User canceled the operation') && !errorMessage.includes('PIN entry cancelled')) {
            setError(`Could not import seed words: ${error}`, true);
        }
        useWalletStore.setState((c) => ({ ...c, is_wallet_importing: false }));
    } finally {
        useWalletStore.setState((c) => ({ ...c, is_wallet_importing: false }));
    }
};

export const refreshTransactions = async () => {
    const { tx_history, coinbase_transactions, tx_history_filter } = useWalletStore.getState();
    await fetchTransactionsHistory({ offset: 0, limit: Math.max(tx_history.length, 20), filter: tx_history_filter });
    await fetchCoinbaseTransactions({
        offset: 0,
        limit: Math.max(coinbase_transactions.length, 20),
    });
};

export const setExternalTariAddress = async (newAddress: string) => {
    await invoke('set_external_tari_address', { address: newAddress })
        .then(() => {
            console.info('New Tari address set successfully to:', newAddress);
        })
        .catch((e) => {
            console.error('Could not set external tari address', e);
            setError('Could not change external tari address');
        });
};

export const setWalletBalance = async (balance: WalletBalance) => {
    const calculated_balance =
        balance.available_balance + balance.timelocked_balance + balance.pending_incoming_balance;
    useWalletStore.setState((c) => ({
        ...c,
        balance: { ...balance },
        calculated_balance,
    }));
};

export const setIsSwapping = (isSwapping: boolean) => {
    useWalletStore.setState((c) => ({ ...c, is_swapping: isSwapping }));
};

export const setTxHistoryFilter = (filter: TxHistoryFilter) => {
    useWalletStore.setState((c) => ({ ...c, tx_history_filter: filter }));
};

export const setDetailsItem = (detailsItem: CombinedBridgeWalletTransaction | null) =>
    useWalletStore.setState((c) => ({ ...c, detailsItem }));

export const handleSelectedTariAddressChange = (payload: TariAddressUpdatePayload) => {
    const { tari_address_base58, tari_address_emoji, tari_address_type } = payload;
    useWalletStore.setState((c) => ({
        ...c,
        is_wallet_importing: useWalletStore.getState().is_wallet_importing,
        tari_address_base58,
        tari_address_emoji,
        tari_address_type,
    }));
};

export const setExchangeETHAdress = (ethAddress: string, exchangeId: string) => {
    const newEntry = { [exchangeId]: ethAddress };

    useWalletStore.setState((c) => ({
        ...c,
        exchange_wxtm_addresses: {
            ...c.exchange_wxtm_addresses,
            ...newEntry,
        },
    }));
};

export const handlePinLocked = (is_pin_locked: boolean) => {
    useWalletStore.setState((c) => ({
        ...c,
        is_pin_locked,
    }));
};

export const handleSeedBackedUp = (is_seed_backed_up: boolean) => {
    useWalletStore.setState((c) => ({
        ...c,
        is_seed_backed_up,
    }));
};
