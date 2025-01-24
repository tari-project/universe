import { create } from './create';
import { useMiningStore } from './useMiningStore.ts';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { BlockTimeData } from '@app/types/mining.ts';
import { setAnimationState } from '@app/visuals.ts';
import { TransactionInfo } from '@app/types/app-status.ts';

const appWindow = getCurrentWindow();

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
    replayItem?: TransactionInfo;
}

interface WinAnimation {
    latestTx: TransactionInfo;
    canAnimate?: boolean;
}
interface Actions {
    setDisplayBlockHeight: (displayBlockHeight: number) => void;
    setDisplayBlockTime: (displayBlockTime: BlockTimeData) => void;
    setDebugBlockTime: (displayBlockTime: BlockTimeData) => void;
    setRecapCount: (recapCount?: number) => void;
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

    setDisplayBlockHeight: (displayBlockHeight) => set({ displayBlockHeight }),
    setDisplayBlockTime: (displayBlockTime) => set({ displayBlockTime }),
    setDebugBlockTime: (debugBlockTime) => set({ debugBlockTime }),
    setRecapCount: (recapCount) => set({ recapCount }),
}));

const handleWin = async ({ latestTx, canAnimate }: WinAnimation) => {
    const blockHeight = Number(latestTx?.mined_in_block_height);
    const earnings = latestTx.amount;

    console.info(`Block #${blockHeight} mined! Earnings: ${earnings}`);

    if (canAnimate) {
        useMiningStore.getState().setMiningControlsEnabled(false);
        const successTier = getSuccessTier(earnings);

        setAnimationState(successTier);
        useBlockchainVisualisationStore.setState({ earnings });
        const winTimeout = setTimeout(() => {
            useMiningStore.getState().setMiningControlsEnabled(true);
            useBlockchainVisualisationStore.setState({ displayBlockHeight: blockHeight, earnings: undefined });
        }, 2000);

        return clearTimeout(winTimeout);
    } else {
        return useBlockchainVisualisationStore.setState((curr) => ({
            recapIds: [...curr.recapIds, latestTx.tx_id],
            displayBlockHeight: blockHeight,
            earnings: undefined,
        }));
    }
};
const handleFail = async (blockHeight: number, canAnimate: boolean) => {
    if (canAnimate) {
        useMiningStore.getState().setMiningControlsEnabled(false);
        setAnimationState('fail');
        const failTimeout = setTimeout(() => {
            useMiningStore.getState().setMiningControlsEnabled(true);
            useBlockchainVisualisationStore.setState({ displayBlockHeight: blockHeight });
        }, 1000);
        return clearTimeout(failTimeout);
    } else {
        return useBlockchainVisualisationStore.setState({ displayBlockHeight: blockHeight });
    }
};

export const handleWinRecap = (recapData: Recap) => {
    useMiningStore.getState().setMiningControlsEnabled(false);
    const successTier = getSuccessTier(recapData.totalEarnings);
    setAnimationState(successTier);
    useBlockchainVisualisationStore.setState({ recapData, recapCount: recapData.count });
    setTimeout(() => {
        useMiningStore.getState().setMiningControlsEnabled(true);
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
export const handleNewBlock = async (newBlockHeight: number, latestTx?: TransactionInfo) => {
    const minimized = await appWindow?.isMinimized();
    const documentIsVisible = document?.visibilityState === 'visible' || false;
    const canAnimate = !minimized && documentIsVisible;
    const latestTxBlock = latestTx?.mined_in_block_height;
    console.debug(`latestTxBlock= `, latestTxBlock);
    console.debug(`newBlockHeight= `, newBlockHeight);
    if (latestTx && latestTxBlock === newBlockHeight) {
        await handleWin({ latestTx, canAnimate });
    } else {
        await handleFail(newBlockHeight, canAnimate);
    }
};
