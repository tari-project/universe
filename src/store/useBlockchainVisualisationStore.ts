import { create } from 'zustand';

import { useMiningStore } from './useMiningStore.ts';
import { getCurrentWindow } from '@tauri-apps/api/window';

import { setAnimationState } from '@tari-project/tari-tower';
import { WalletTransaction, TransactionInfo } from '@app/types/app-status.ts';
import { setMiningControlsEnabled } from './actions/miningStoreActions.ts';
import { updateWalletScanningProgress, useWalletStore } from './useWalletStore.ts';
import { useConfigUIStore } from '@app/store/useAppConfigStore.ts';

const appWindow = getCurrentWindow();
interface LatestBlockPayload {
    block_height: number;
    coinbase_transaction?: TransactionInfo;
}
interface Recap {
    count: number;
    totalEarnings: number;
}
interface State {
    earnings?: number;
    recapData?: Recap;
    recapCount?: number;
    rewardCount?: number;
    recapIds: string[];
    replayItem?: WalletTransaction;
    latestBlockPayload?: LatestBlockPayload;
}

interface Actions {
    setRecapCount: (recapCount?: number) => void;
    setRewardCount: (rewardCount?: number) => void;
}

type BlockchainVisualisationStoreState = State & Actions;

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

export const useBlockchainVisualisationStore = create<BlockchainVisualisationStoreState>()((set) => ({
    recapIds: [],
    setRecapCount: (recapCount) => set({ recapCount }),
    setRewardCount: (rewardCount) => set({ rewardCount }),
}));

const handleWin = async (transaction: WalletTransaction, canAnimate: boolean) => {
    const blockHeight = Number(transaction?.mined_height);
    const earnings = transaction.transaction_balance;

    console.info(`Block #${blockHeight} mined! Earnings: ${earnings}`);

    useBlockchainVisualisationStore.setState((curr) => ({ ...curr, rewardCount: (curr.rewardCount || 0) + 1 }));
    if (canAnimate) {
        const visualModeEnabled = useConfigUIStore.getState().visual_mode;
        if (visualModeEnabled) {
            setMiningControlsEnabled(false);
            const successTier = getSuccessTier(earnings);
            setAnimationState(successTier);
            setMiningControlsEnabled(true);
        }
        useBlockchainVisualisationStore.setState((c) => ({ ...c, earnings }));
        useBlockchainVisualisationStore.setState((c) => ({ ...c, earnings: undefined, latestBlockPayload: undefined }));
    } else {
        useBlockchainVisualisationStore.setState((curr) => ({
            ...curr,
            recapIds: [...curr.recapIds, transaction.id],
            displayBlockHeight: blockHeight,
            earnings: undefined,
            latestBlockPayload: undefined,
        }));
    }
};
const handleFail = async (canAnimate: boolean) => {
    const visualModeEnabled = useConfigUIStore.getState().visual_mode;
    if (canAnimate && visualModeEnabled) {
        setMiningControlsEnabled(false);
        setAnimationState('fail');
        setMiningControlsEnabled(true);
    }
    useBlockchainVisualisationStore.setState((c) => ({ ...c, latestBlockPayload: undefined }));
};

export const handleWinRecap = (recapData: Recap) => {
    setMiningControlsEnabled(false);
    const successTier = getSuccessTier(recapData.totalEarnings);
    setAnimationState(successTier);
    setMiningControlsEnabled(true);
    useBlockchainVisualisationStore.setState((c) => ({ ...c, recapData, recapCount: recapData.count }));
};
export const handleWinReplay = (txItem: WalletTransaction) => {
    const earnings = txItem.transaction_balance;
    const successTier = getSuccessTier(earnings);
    useBlockchainVisualisationStore.setState((c) => ({ ...c, replayItem: txItem }));
    setAnimationState(successTier, true);
};

export const handleReplayComplete = () => {
    const wasRecap = !!useBlockchainVisualisationStore.getState().recapData;
    useBlockchainVisualisationStore.setState((c) => ({
        ...c,
        replayItem: undefined,
    }));
    if (wasRecap) {
        setMiningControlsEnabled(true);
        useBlockchainVisualisationStore.setState((c) => ({ ...c, recapData: undefined, recapIds: [] }));
    }
};

export async function processNewBlock(payload: { block_height: number; transaction?: WalletTransaction }) {
    if (useMiningStore.getState().isCpuMiningInitiated || useMiningStore.getState().isGpuMiningInitiated) {
        const minimized = await appWindow?.isMinimized();
        const documentIsVisible = document?.visibilityState === 'visible' || false;
        const canAnimate = !minimized && documentIsVisible;
        if (payload.transaction) {
            await handleWin(payload.transaction, canAnimate);
        } else {
            await handleFail(canAnimate);
        }
    }
}

export const handleNewBlockPayload = async (payload: LatestBlockPayload) => {
    useBlockchainVisualisationStore.setState((c) => ({ ...c, latestBlockPayload: payload }));
    const isWalletScanned = useWalletStore.getState().wallet_scanning?.is_initial_scan_finished;
    if (!isWalletScanned) {
        updateWalletScanningProgress({
            progress: 1,
            scanned_height: payload.block_height,
            total_height: payload.block_height,
            is_initial_scan_finished: false,
        });
    }
};
