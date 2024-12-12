import { Transaction } from '@app/types/wallet';
import { create } from './create';
import { useMiningStore } from './useMiningStore.ts';

import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { BlockTimeData } from '@app/types/mining.ts';
import { setAnimationState } from '@app/visuals.ts';
import { TransactionInfo } from '@app/types/app-status.ts';
import { useWalletStore } from './useWalletStore.ts';
const appWindow = getCurrentWebviewWindow();

interface Recap {
    count: number;
    totalEarnings: number;
}
interface State {
    displayBlockTime?: BlockTimeData;
    debugBlockTime?: BlockTimeData;
    displayBlockHeight?: number;
    earnings?: number;
    recapData?: Recap;
    recapCount?: number;
    recapIds: TransactionInfo['tx_id'][];
    replayItem?: Transaction;
}

interface WinAnimation {
    latestTx: TransactionInfo;
    canAnimate?: boolean;
    isRecap?: boolean;
}
interface Actions {
    handleWin: ({ latestTx, canAnimate, isRecap }: WinAnimation) => Promise<void>;
    handleWinRecap: (recapData: Recap) => void;
    handleWinReplay: (txItem: Transaction) => void;
    handleFail: (blockHeight: number, canAnimate?: boolean) => Promise<void>;
    handleNewBlock: (newBlockHeight: number, isMining?: boolean) => Promise<void>;
    setDisplayBlockHeight: (displayBlockHeight: number) => void;
    setDisplayBlockTime: (displayBlockTime: BlockTimeData) => void;
    setDebugBlockTime: (displayBlockTime: BlockTimeData) => void;
    setRecapCount: (recapCount?: number) => void;
}

type BlockchainVisualisationStoreState = State & Actions;

const checkCanAnimate = async () => {
    const focused = await appWindow?.isFocused();
    const minimized = await appWindow?.isMinimized();
    const documentIsVisible = document?.visibilityState === 'visible' || false;

    return !minimized && (focused || documentIsVisible);
};

function getSuccessTier(earnings: number) {
    const humanValue = earnings / 1_000_000;

    if (humanValue < 100) {
        return 'success';
    }

    if (humanValue <= 1000) {
        return 'success2';
    }

    return 'success3';
}

export const useBlockchainVisualisationStore = create<BlockchainVisualisationStoreState>()((set, getState) => ({
    recapIds: [],
    handleWinRecap: (recapData) => {
        useMiningStore.getState().setMiningControlsEnabled(false);
        const successTier = getSuccessTier(recapData.totalEarnings);
        setAnimationState(successTier);
        set({ recapData, recapCount: recapData.count });
        setTimeout(() => {
            useMiningStore.getState().setMiningControlsEnabled(true);
            set({ recapData: undefined, recapIds: [] });
        }, 2000);
    },
    handleWinReplay: (txItem) => {
        const earnings = txItem.amount;
        const successTier = getSuccessTier(earnings);
        set({ replayItem: txItem });
        setAnimationState(successTier, true);
        setTimeout(() => {
            set({ replayItem: undefined });
        }, 1500);
    },
    handleWin: async ({ latestTx, canAnimate }) => {
        const blockHeight = Number(latestTx?.message?.split(': ')[1]);
        const earnings = latestTx.amount;

        console.info(`Block #${blockHeight} mined! Earnings: ${earnings}`);

        if (canAnimate) {
            useMiningStore.getState().setMiningControlsEnabled(false);
            const successTier = getSuccessTier(earnings);

            setAnimationState(successTier);
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
                await getState().handleWin({ latestTx: latestTransaction, canAnimate });
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
    setRecapCount: (recapCount) => set({ recapCount }),
}));
