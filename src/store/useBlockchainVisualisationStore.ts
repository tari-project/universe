import { create } from 'zustand';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { setAnimationState } from '@tari-project/tari-tower';
import { DisplayedTransaction } from '@app/types/app-status.ts';
import { setMiningControlsEnabled } from './actions/miningStoreActions.ts';
import { updateWalletScanningProgress, useWalletStore } from './useWalletStore.ts';
import { useConfigUIStore } from '@app/store/useAppConfigStore.ts';

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
    recapIds: string[];
    replayItem?: DisplayedTransaction;
    latestBlockHeight?: number;
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
export const handleWinReplay = (txItem: DisplayedTransaction) => {
    const earnings = txItem.amount;
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

export async function processNewBlock() {
    const minimized = await appWindow?.isMinimized();
    const documentIsVisible = document?.visibilityState === 'visible' || false;
    const canAnimate = !minimized && documentIsVisible;

    await handleFail(canAnimate);
}

export const handleNewBlockPayload = async (block_height: number) => {
    useBlockchainVisualisationStore.setState((c) => ({ ...c, latestBlockHeight: block_height }));
    const isWalletScanned = useWalletStore.getState().wallet_scanning?.is_initial_scan_complete;
    if (isWalletScanned) {
        updateWalletScanningProgress({
            progress: 1,
            scanned_height: block_height,
            total_height: block_height,
            is_initial_scan_complete: true,
        });
    }
};
