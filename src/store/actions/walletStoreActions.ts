import { invoke } from '@tauri-apps/api/core';
import { WalletAddress, WalletBalance } from '@app/types/app-status.ts';
import { BackendBridgeTransaction, useWalletStore } from '../useWalletStore';
import { setError } from './appStateStoreActions';
import { setCurrentExchangeMinerId, universalExchangeMinerOption } from '@app/store/useExchangeStore.ts';
import { WrapTokenService, OpenAPI } from '@tari-project/wxtm-bridge-backend-api';
import { useConfigBEInMemoryStore } from '../useAppConfigStore';
import { TransactionDetailsItem, TransactionDirection, TransactionStatus } from '@app/types/transactions';
import { useUIStore } from '../useUIStore';
import { setSeedlessUI } from './uiStoreActions';
import { refreshTransactions } from '@app/hooks/wallet/useFetchTxHistory.ts';

export const fetchBridgeTransactionsHistory = async () => {
    console.info('Fetching bridge transactions history...');
    const baseUrl = useConfigBEInMemoryStore.getState().bridgeBackendApiUrl;
    if (baseUrl?.includes('env var not defined')) return;
    OpenAPI.BASE = baseUrl;
    await WrapTokenService.getUserTransactions(useWalletStore.getState().tari_address_base58)
        .then((response) => {
            console.info('Bridge transactions fetched successfully:', response);
            useWalletStore.setState({
                bridge_transactions: response.transactions,
            });
        })
        .catch((error) => {
            console.error('Could not fetch bridge transactions history: ', error);
            throw new Error(`Could not fetch bridge transactions history: ${error}`);
        });
};

export const fetchBridgeColdWalletAddress = async () => {
    const baseUrl = useConfigBEInMemoryStore.getState().bridgeBackendApiUrl;
    if (baseUrl?.includes('env var not defined')) return;
    try {
        OpenAPI.BASE = baseUrl;
        await WrapTokenService.getWrapTokenParams().then((response) => {
            console.info('Bridge safe wallet address fetched successfully:', response);
            useWalletStore.setState({
                cold_wallet_address: response.coldWalletAddress,
            });
        });
    } catch (error) {
        console.error('Could not get bridge safe wallet address: ', error);
    }
};

export const importSeedWords = async (seedWords: string[]) => {
    useWalletStore.setState({
        is_wallet_importing: true,
        coinbase_transactions: [],
        transactions: [],
        bridge_transactions: [],
        has_more_coinbase_transactions: true,
        has_more_transactions: true,
        is_reward_history_loading: false,
        is_transactions_history_loading: false,
        wallet_scanning: {
            is_scanning: true,
            scanned_height: 0,
            total_height: 0,
            progress: 0,
        },
    });
    try {
        await invoke('import_seed_words', { seedWords });
        await refreshTransactions();
        useWalletStore.setState({ is_wallet_importing: false });
    } catch (error) {
        setError(`Could not import seed words: ${error}`, true);
        useWalletStore.setState({ is_wallet_importing: false });
    } finally {
        useWalletStore.setState({ is_wallet_importing: false });
    }
};

export const setExternalTariAddress = async (newAddress: string) => {
    await invoke('set_external_tari_address', { address: newAddress })
        .then(() => {
            console.info('New Tari address set successfully to:', newAddress);
        })
        .catch((e) => {
            console.error('Could not set Monero address', e);
            setError('Could not change Monero address');
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

    if (pendingTxs?.length > 0) {
        console.info('Pending txs: ', pendingTxs);
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

export const setDetailsItem = (detailsItem: TransactionDetailsItem | BackendBridgeTransaction | null) =>
    useWalletStore.setState({ detailsItem });

export const handleExternalWalletAddressUpdate = (payload?: WalletAddress) => {
    const isSeedlessUI = useUIStore.getState().seedlessUI;
    if (payload) {
        useWalletStore.setState((c) => ({
            ...c,
            external_tari_address_base58: payload.tari_address_base58,
            external_tari_address_emoji: payload.tari_address_emoji,
        }));

        if (!isSeedlessUI) {
            setSeedlessUI(true);
        }
    } else {
        useWalletStore.setState((c) => ({
            ...c,
            external_tari_address_base58: undefined,
            external_tari_address_emoji: undefined,
        }));
        if (isSeedlessUI) {
            setSeedlessUI(false);
            setCurrentExchangeMinerId(universalExchangeMinerOption.exchange_id);
            refreshTransactions();
        }
    }
};

export const handleBaseWalletUpate = (payload: WalletAddress) => {
    useWalletStore.setState((c) => ({
        ...c,
        tari_address_base58: payload.tari_address_base58,
        tari_address_emoji: payload.tari_address_emoji,
    }));
};
