import { create } from './create';
import { useMiningStore } from './useMiningStore.ts';

import { appWindow } from '@tauri-apps/api/window';
import { BlockTimeData } from '@app/types/mining.ts';
import { setAnimationState } from '@app/visuals.ts';
import { TransactionInfo } from '@app/types/app-status.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';

interface State {
    displayBlockTime?: BlockTimeData;
    debugBlockTime?: BlockTimeData;
    displayBlockHeight?: number;
    earnings?: number;
    recapIds: TransactionInfo['tx_id'][];
}

interface Actions {
    handleWin: (latestTx: TransactionInfo, canAnimate?: boolean) => Promise<void>;
    handleFail: (blockHeight: number, canAnimate?: boolean) => Promise<void>;
    handleNewBlock: (newBlockHeight: number, isMining?: boolean) => Promise<void>;
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

export const useBlockchainVisualisationStore = create<BlockchainVisualisationStoreState>()((set, getState) => ({
    recapIds: [],
    handleWin: async (latestTx: TransactionInfo, canAnimate) => {
        const blockHeight = Number(latestTx.message?.split(': ')[1]);
        const earnings = latestTx.amount;
        console.info(`Block #${blockHeight} mined! Earnings: ${earnings}`);

        if (canAnimate) {
            useMiningStore.getState().setMiningControlsEnabled(false);
            setAnimationState('success');
            set({ earnings });
            setTimeout(() => {
                useMiningStore.getState().setMiningControlsEnabled(true);
                set({ displayBlockHeight: blockHeight, earnings: undefined });
            }, 2000);
        } else {
            set((curr) => ({ recapIds: [...curr.recapIds, latestTx.tx_id] }));
            set({ displayBlockHeight: blockHeight, earnings: undefined });
        }
    },
    handleFail: async (blockHeight, canAnimate) => {
        if (canAnimate) {
            useMiningStore.getState().setMiningControlsEnabled(false);
            setAnimationState('fail');
            setTimeout(() => {
                useMiningStore.getState().setMiningControlsEnabled(true);
                set({ displayBlockHeight: blockHeight });
            }, 1000);
        } else {
            set({ displayBlockHeight: blockHeight });
        }
    },
    handleNewBlock: async (newBlockHeight, isMining) => {
        if (isMining) {
            const canAnimate = await checkCanAnimate();

            const latestTransaction = useWalletStore.getState().transactions?.[0];
            const latestTxBlock = latestTransaction?.message?.split(': ')?.[1];

            if (latestTxBlock === newBlockHeight.toString()) {
                await getState().handleWin(latestTransaction, canAnimate);
            } else {
                await getState().handleFail(newBlockHeight, canAnimate);
            }
        } else {
            set({ displayBlockHeight: newBlockHeight });
        }
    },
    setDisplayBlockHeight: (displayBlockHeight) => set({ displayBlockHeight }),
    setDisplayBlockTime: (displayBlockTime) => set({ displayBlockTime }),
    setDebugBlockTime: (debugBlockTime) => set({ debugBlockTime }),
}));
