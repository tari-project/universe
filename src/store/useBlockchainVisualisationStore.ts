import { setWalletBalance } from '@app/store/actions';

import { create } from './create';
import { useMiningStore } from './useMiningStore.ts';
import { getCurrentWindow } from '@tauri-apps/api/window';

import { setAnimationState } from '@tari-project/tari-tower';
import { TransactionInfo, WalletBalance } from '@app/types/app-status.ts';
import { setMiningControlsEnabled } from './actions/miningStoreActions.ts';
import { updateWalletScanningProgress, useWalletStore } from './useWalletStore.ts';
import { useConfigUIStore } from '@app/store/useAppConfigStore.ts';
import { refreshTransactions } from '@app/hooks/wallet/useFetchTxHistory.ts';

const appWindow = getCurrentWindow();

interface Recap {
    count: number;
    totalEarnings: number;
}
interface State {
    earnings?: number;
    recapData?: Recap;
    recapCount?: number;
    rewardCount?: number;
    recapIds: TransactionInfo['tx_id'][];
    replayItem?: TransactionInfo;
}

interface Actions {
    setRecapCount: (recapCount?: number) => void;
    setRewardCount: (rewardCount?: number) => void;
}

type BlockchainVisualisationStoreState = State & Actions;

const getSuccessTier = (earnings: number) => {
    const humanValue = earnings / 1_000_000;
    if (humanValue < 100) {
        return 'success';
    }
    if (humanValue <= 1000) {
        return 'success2';
    }
    return 'success3';
};

export const useBlockchainVisualisationStore = create<BlockchainVisualisationStoreState>()((set) => ({
    recapIds: [],
    setRecapCount: (recapCount) => set({ recapCount }),
    setRewardCount: (rewardCount) => set({ rewardCount }),
}));

const handleWin = async (coinbase_transaction: TransactionInfo, balance: WalletBalance, canAnimate: boolean) => {
    const blockHeight = Number(coinbase_transaction?.mined_in_block_height);
    const earnings = coinbase_transaction.amount;

    console.info(`Block #${blockHeight} mined! Earnings: ${earnings}`);

    useBlockchainVisualisationStore.setState((curr) => ({ rewardCount: (curr.rewardCount || 0) + 1 }));
    if (canAnimate) {
        setMiningControlsEnabled(false);
        const visualModeEnabled = useConfigUIStore.getState().visual_mode;
        if (visualModeEnabled) {
            const successTier = getSuccessTier(earnings);
            setAnimationState(successTier);
        }
        useBlockchainVisualisationStore.setState({ earnings });
        await refreshTransactions();
        await setWalletBalance(balance);
        setMiningControlsEnabled(true);
        useBlockchainVisualisationStore.setState({ earnings: undefined });
    } else {
        await refreshTransactions();
        useBlockchainVisualisationStore.setState((curr) => ({
            recapIds: [...curr.recapIds, coinbase_transaction.tx_id],
            displayBlockHeight: blockHeight,
            earnings: undefined,
        }));
    }
};
const handleFail = async (_blockHeight: number, balance: WalletBalance, canAnimate: boolean) => {
    const visualModeEnabled = useConfigUIStore.getState().visual_mode;
    if (canAnimate && visualModeEnabled) {
        setMiningControlsEnabled(false);
        setAnimationState('fail');
        await refreshTransactions();
        await setWalletBalance(balance);
        setMiningControlsEnabled(true);
    }
};

export const handleWinRecap = (recapData: Recap) => {
    setMiningControlsEnabled(false);
    const successTier = getSuccessTier(recapData.totalEarnings);
    setAnimationState(successTier);
    useBlockchainVisualisationStore.setState({ recapData, recapCount: recapData.count });
    setTimeout(() => {
        setMiningControlsEnabled(true);
        useBlockchainVisualisationStore.setState({ recapData: undefined, recapIds: [] });
    }, 2000);
};
export const handleWinReplay = (txItem: TransactionInfo) => {
    const earnings = txItem.amount;
    const successTier = getSuccessTier(earnings);
    useBlockchainVisualisationStore.setState({ replayItem: txItem });
    setAnimationState(successTier, true);
    setTimeout(() => {
        useBlockchainVisualisationStore.setState({ replayItem: undefined });
    }, 1500);
};

let newBlockDebounceTimeout: NodeJS.Timeout | undefined = undefined;
const BLOCK_DEBOUNCE_DELAY = 200;
let latestBlockPayload:
    | {
          block_height: number;
          coinbase_transaction?: TransactionInfo;
          balance: WalletBalance;
      }
    | undefined = undefined;

async function processNewBlock(payload: {
    block_height: number;
    coinbase_transaction?: TransactionInfo;
    balance: WalletBalance;
}) {
    if (useMiningStore.getState().isCpuMiningInitiated || useMiningStore.getState().isGpuMiningInitiated) {
        const minimized = await appWindow?.isMinimized();
        const documentIsVisible = document?.visibilityState === 'visible' || false;
        const canAnimate = !minimized && documentIsVisible;
        if (payload.coinbase_transaction) {
            await handleWin(payload.coinbase_transaction, payload.balance, canAnimate);
        } else {
            await handleFail(payload.block_height, payload.balance, canAnimate);
        }
    } else {
        await refreshTransactions();
    }
}

export const handleNewBlock = async (payload: {
    block_height: number;
    coinbase_transaction?: TransactionInfo;
    balance: WalletBalance;
}) => {
    latestBlockPayload = payload;

    const isWalletScanned = !useWalletStore.getState().wallet_scanning?.is_scanning;
    if (!isWalletScanned) {
        updateWalletScanningProgress({
            progress: 1,
            scanned_height: payload.block_height,
            total_height: payload.block_height,
        });
    }

    if (newBlockDebounceTimeout) {
        clearTimeout(newBlockDebounceTimeout);
    }
    newBlockDebounceTimeout = setTimeout(async () => {
        if (latestBlockPayload) {
            await processNewBlock(latestBlockPayload);
            latestBlockPayload = undefined;
        }
        newBlockDebounceTimeout = undefined;
    }, BLOCK_DEBOUNCE_DELAY);
};
