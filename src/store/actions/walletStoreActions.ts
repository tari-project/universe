import { invoke } from '@tauri-apps/api/core';
import { ALREADY_FETCHING } from '@app/App/sentryIgnore.ts';
import { WalletAddress, WalletBalance } from '@app/types/app-status.ts';
import { useWalletStore } from '../useWalletStore';
import { restartMining } from './miningStoreActions';
import { setError } from './appStateStoreActions';
import { setExchangeContent } from '@app/store/useExchangeStore.ts';
import { TransactionDirection, TransactionStatus } from '@app/types/transactions';

export const COINBASE_BITFLAG =
    (1 << TransactionStatus.CoinbaseConfirmed) | (1 << TransactionStatus.CoinbaseUnconfirmed);
export const NON_COINBASE_BITFLAG: number =
    (1 << TransactionStatus.Completed) |
    (1 << TransactionStatus.Broadcast) |
    (1 << TransactionStatus.MinedUnconfirmed) |
    (1 << TransactionStatus.Imported) |
    (1 << TransactionStatus.Pending) |
    (1 << TransactionStatus.MinedConfirmed) |
    (1 << TransactionStatus.Rejected) |
    (1 << TransactionStatus.OneSidedUnconfirmed) |
    (1 << TransactionStatus.OneSidedConfirmed) |
    (1 << TransactionStatus.Queued) |
    (1 << TransactionStatus.NotFound);

export interface TxArgs {
    offset?: number;
    limit?: number;
}
type StoreKey = 'coinbase_transactions' | 'transactions';

interface FetchConfig {
    storeKey: StoreKey;
    bitflag: number;
}

const fetchTransactions = async ({ offset = 0, limit }: TxArgs, { storeKey, bitflag }: FetchConfig) => {
    try {
        const currentTxs = useWalletStore.getState()[storeKey];
        const fetchedTxs = await invoke('get_transactions', { offset, limit, statusBitflag: bitflag });

        const updatedTxs = offset > 0 ? [...currentTxs, ...fetchedTxs] : fetchedTxs;
        useWalletStore.setState({ [storeKey]: updatedTxs });
        return updatedTxs;
    } catch (error) {
        if (error !== ALREADY_FETCHING.HISTORY && error !== ALREADY_FETCHING.TX_HISTORY) {
            console.error(`Could not get transaction history for ${storeKey}: `, error);
        }
        return [];
    }
};

export const fetchCoinbaseTransactions = (args: TxArgs) =>
    fetchTransactions(args, {
        storeKey: 'coinbase_transactions',
        bitflag: COINBASE_BITFLAG,
    });

export const fetchNonCoinbaseTransactions = (args: TxArgs) =>
    fetchTransactions(args, {
        storeKey: 'transactions',
        bitflag: NON_COINBASE_BITFLAG,
    });

export const importSeedWords = async (seedWords: string[]) => {
    try {
        useWalletStore.setState({ is_wallet_importing: true });
        await invoke('import_seed_words', { seedWords });
    } catch (error) {
        setError(`Could not import seed words: ${error}`, true);
        useWalletStore.setState({ is_wallet_importing: false });
    }
};

export const refreshTransactions = async () => {
    const { transactions, coinbase_transactions } = useWalletStore.getState();
    await fetchNonCoinbaseTransactions({ offset: 0, limit: Math.max(transactions.length, 20) });
    await fetchCoinbaseTransactions({ offset: 0, limit: Math.max(coinbase_transactions.length, 20) });
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
    if (!pendingTxs.length) {
        console.info('No pending outgoing transactions');
    }
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
