import { invoke } from '@tauri-apps/api/core';
import { ALREADY_FETCHING } from '@app/App/sentryIgnore.ts';
import { WalletAddress, WalletBalance } from '@app/types/app-status.ts';
import { useWalletStore } from '../useWalletStore';
import { restartMining } from './miningStoreActions';
import { setError } from './appStateStoreActions';
import { setExchangeContent } from '@app/store/useExchangeStore.ts';
import { TransactionDetailsItem, TransactionDirection, TransactionStatus } from '@app/types/transactions';
import { queryClient } from '@app/App/queryClient.ts';

export interface TxArgs {
    offset?: number;
    limit?: number;
}

export const fetchTransactionsHistory = async ({ offset = 0, limit }: TxArgs) => {
    if (useWalletStore.getState().is_transactions_history_loading) {
        return [];
    }

    try {
        useWalletStore.setState({ is_transactions_history_loading: true });
        const currentTxs = useWalletStore.getState().transactions;
        const fetchedTxs = await invoke('get_transactions_history', { offset, limit });

        const transactions = offset > 0 ? [...currentTxs, ...fetchedTxs] : fetchedTxs;
        const has_more_transactions = fetchedTxs.length > 0 && (!limit || fetchedTxs.length === limit);
        useWalletStore.setState({
            has_more_transactions,
            transactions,
        });
        return transactions;
    } catch (error) {
        if (error !== ALREADY_FETCHING.HISTORY && error !== ALREADY_FETCHING.TX_HISTORY) {
            console.error('Could not get transaction history: ', error);
        }
        return [];
    } finally {
        useWalletStore.setState({ is_transactions_history_loading: false });
    }
};
export const importSeedWords = async (seedWords: string[]) => {
    try {
        useWalletStore.setState({ is_wallet_importing: true });
        await invoke('import_seed_words', { seedWords });
    } catch (error) {
        setError(`Could not import seed words: ${error}`, true);
        useWalletStore.setState({ is_wallet_importing: false });
    }
};
const _initialFetchTxs = () =>
    fetchTransactionsHistory({ offset: 0, limit: 20 }).then((tx) => {
        if (tx?.length) {
            useWalletStore.setState({ newestTxIdOnInitialFetch: tx[0]?.tx_id });
        }
    });

export const refreshTransactions = async () => {
    // TODO - move out of store actions
    await queryClient.invalidateQueries({ queryKey: ['transactions'] });
};

export const setGeneratedTariAddress = async (newAddress: string) => {
    await invoke('set_tari_address', { address: newAddress })
        .then(() => {
            setExchangeContent(null);
            restartMining();
            console.info('New Tari address set successfully to:', newAddress);
        })
        .catch((e) => {
            console.error('Could not set Monero address', e);
            setError('Could not change Monero address');
        });
};

export const setWalletAddress = (addresses: Partial<WalletAddress>) => {
    useWalletStore.setState({
        tari_address_base58: addresses.tari_address_base58,
        tari_address_emoji: addresses.tari_address_emoji,
        is_tari_address_generated: addresses.is_tari_address_generated,
    });
};

const getPendingOutgoingBalance = async () => {
    const pendingTxs = useWalletStore
        .getState()
        .transactions.filter(
            (tx) =>
                tx.direction == TransactionDirection.Outbound &&
                [TransactionStatus.Completed, TransactionStatus.Broadcast].includes(tx.status)
        );
    console.info('Pending txs: ', pendingTxs);
    return pendingTxs.reduce((acc, tx) => acc + tx.amount, 0);
};

export const setWalletBalance = async (balance: WalletBalance) => {
    const pendingOutgoingBalance = await getPendingOutgoingBalance();
    console.info('Setting new wallet balance: ', { balance, pendingOutgoingBalance });
    const available_balance = balance.available_balance - pendingOutgoingBalance;
    const pending_outgoing_balance = balance.pending_outgoing_balance + pendingOutgoingBalance;

    const calculated_balance = available_balance + balance.timelocked_balance + balance.pending_incoming_balance;
    useWalletStore.setState({
        balance: { ...balance, available_balance, pending_outgoing_balance },
        calculated_balance,
    });
};

export const setIsSwapping = (isSwapping: boolean) => {
    useWalletStore.setState({ is_swapping: isSwapping });
};

export const setDetailsItem = (detailsItem: TransactionDetailsItem | null) => useWalletStore.setState({ detailsItem });
