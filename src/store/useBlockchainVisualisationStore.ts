import { create } from './create';
import { useMiningStore } from './useMiningStore.ts';
import { useWalletStore } from './useWalletStore.ts';
import { appWindow } from '@tauri-apps/api/window';
import { BlockTimeData } from '@app/types/mining.ts';
import { setAnimationState } from '@app/visuals.ts';

interface State {
    displayBlockTime?: BlockTimeData;
    displayBlockHeight?: number;
    earnings?: number;
}

interface Actions {
    handleNewBlock: (isMining: boolean, blockHeight: number) => Promise<void>;
    handleWin: (blockHeight: number, earnings: number) => Promise<void>;
    handleFail: (blockHeight: number) => Promise<void>;
    setDisplayBlockHeight: (displayBlockHeight: number) => void;
    setDisplayBlockTime: (displayBlockTime: BlockTimeData) => void;
}

type BlockchainVisualisationStoreState = State & Actions;

const FETCH_EARNING_RETRIES = 15;

function logBalanceChanges({ currBalance, prevBalance, balanceDiff }) {
    console.groupCollapsed('Balance changes:');
    console.info('New Balance:', currBalance);
    console.info('Previous Balance:', prevBalance);
    console.info('Diff/Earnings:', balanceDiff);
    console.groupEnd();
}

const checkCanAnimate = async () => {
    const focused = await appWindow?.isFocused();
    const minimized = await appWindow?.isMinimized();
    const documentIsVisible = document?.visibilityState === 'visible' || false;

    return !minimized && (focused || documentIsVisible);
};

export const useBlockchainVisualisationStore = create<BlockchainVisualisationStoreState>()((set, getState) => ({
    handleNewBlock: async (isMining, blockHeight) => {
        try {
            if (isMining) {
                const { balance: prevBalance } = useWalletStore.getState();

                let retries = FETCH_EARNING_RETRIES;

                const checkEarningsInterval = setInterval(async () => {
                    await useWalletStore.getState().fetchWalletDetails();
                    const { balance: currBalance } = useWalletStore.getState();
                    const balanceDiff = (currBalance || 0) - (prevBalance || 0);
                    const hasEarnings = currBalance && currBalance > 0 && balanceDiff > 0;

                    if (hasEarnings) {
                        logBalanceChanges({ currBalance, prevBalance, balanceDiff });
                        await getState().handleWin(blockHeight, balanceDiff);
                        clearInterval(checkEarningsInterval);
                    } else {
                        retries--;
                        if (retries === 0) {
                            await getState().handleFail(blockHeight);
                            clearInterval(checkEarningsInterval);
                        }
                    }
                }, 1000);
            } else {
                set({ displayBlockHeight: blockHeight });
            }
        } catch (e) {
            console.error('Could not get app config: ', e);
        }
    },
    handleWin: async (blockHeight, earnings) => {
        console.info(`Block #${blockHeight} mined! Earnings: ${earnings}`);
        const canAnimate = await checkCanAnimate();
        if (canAnimate) {
            useMiningStore.getState().setMiningControlsEnabled(false);
            setAnimationState('success');
            set({ earnings });
            setTimeout(() => {
                useMiningStore.getState().setMiningControlsEnabled(true);
                set({ displayBlockHeight: blockHeight, earnings: undefined });
            }, 3000);
        } else {
            set({ displayBlockHeight: blockHeight, earnings: undefined });
        }
    },
    handleFail: async (blockHeight) => {
        const canAnimate = await checkCanAnimate();
        if (canAnimate) {
            useMiningStore.getState().setMiningControlsEnabled(false);
            setAnimationState('fail');
            setTimeout(() => {
                useMiningStore.getState().setMiningControlsEnabled(true);
                set({ displayBlockHeight: blockHeight, earnings: undefined });
            }, 3000);
        } else {
            set({ displayBlockHeight: blockHeight, earnings: undefined });
        }
    },
    setDisplayBlockHeight: (displayBlockHeight) => set({ displayBlockHeight }),
    setDisplayBlockTime: (displayBlockTime) => set({ displayBlockTime }),
}));
