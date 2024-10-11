import { create } from './create';
import { useMiningStore } from './useMiningStore.ts';

import { appWindow } from '@tauri-apps/api/window';
import { BlockTimeData } from '@app/types/mining.ts';
import { setAnimationState } from '@app/visuals.ts';
import { TransactionInfo } from '@app/types/app-status.ts';

interface State {
    displayBlockTime?: BlockTimeData;
    debugBlockTime?: BlockTimeData;
    displayBlockHeight?: number;
    earnings?: number;
    recapIds?: TransactionInfo['tx_id'][];
}

interface Actions {
    handleWin: (latestTx: TransactionInfo) => Promise<void>;
    handleFail: () => Promise<void>;
    setDisplayBlockHeight: (displayBlockHeight: number) => void;
    setDisplayBlockTime: (displayBlockTime: BlockTimeData) => void;
    setDebugBlockTime: (displayBlockTime: BlockTimeData) => void;
}

type BlockchainVisualisationStoreState = State & Actions;

const checkCanAnimate = async () => {
    const focused = await appWindow?.isFocused();
    const minimized = await appWindow?.isMinimized();
    const documentIsVisible = document?.visibilityState === 'visible' || false;

    return !minimized && (focused || documentIsVisible);
};

export const useBlockchainVisualisationStore = create<BlockchainVisualisationStoreState>()((set) => ({
    handleWin: async (latestTx: TransactionInfo) => {
        const blockHeight = Number(latestTx.message?.split(': ')[1]);
        const earnings = latestTx.amount;
        console.info(`Block #${blockHeight} mined! Earnings: ${earnings}`);
        const canAnimate = await checkCanAnimate();

        if (canAnimate) {
            useMiningStore.getState().setMiningControlsEnabled(false);
            setAnimationState('success');
            set({ earnings });
            setTimeout(() => {
                useMiningStore.getState().setMiningControlsEnabled(true);
                set({ displayBlockHeight: blockHeight, earnings: undefined });
            }, 2000);
        } else {
            set({ displayBlockHeight: blockHeight, earnings: undefined });
        }
    },
    handleFail: async () => {
        const canAnimate = await checkCanAnimate();
        if (canAnimate) {
            useMiningStore.getState().setMiningControlsEnabled(false);
            setAnimationState('fail');
            setTimeout(() => {
                useMiningStore.getState().setMiningControlsEnabled(true);
            }, 1000);
        }
    },
    setDisplayBlockHeight: (displayBlockHeight) => set({ displayBlockHeight }),
    setDisplayBlockTime: (displayBlockTime) => set({ displayBlockTime }),
    setDebugBlockTime: (debugBlockTime) => set({ debugBlockTime }),
}));
