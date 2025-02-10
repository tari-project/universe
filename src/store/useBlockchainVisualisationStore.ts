import { create } from './create';
import { useMiningStore } from './useMiningStore.ts';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { BlockTimeData } from '@app/types/mining.ts';
import { setAnimationState } from '@tari-project/tari-tower';
import { TransactionInfo, WalletBalance } from '@app/types/app-status.ts';
import { useWalletStore } from './useWalletStore.ts';
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

const handleWin = async (coinbase_transaction: TransactionInfo, balance: WalletBalance, canAnimate: boolean) => {
    const blockHeight = Number(coinbase_transaction?.mined_in_block_height);
    const earnings = coinbase_transaction.amount;

    console.info(`Block #${blockHeight} mined! Earnings: ${earnings}`);

    if (canAnimate) {
        useMiningStore.getState().setMiningControlsEnabled(false);
        const successTier = getSuccessTier(earnings);

        setAnimationState(successTier);
        useBlockchainVisualisationStore.setState({ earnings });
        setTimeout(() => {
            useBlockchainVisualisationStore.setState({ displayBlockHeight: blockHeight, earnings: undefined });
            useWalletStore.getState().setWalletBalance(balance);
            useWalletStore.getState().refreshCoinbaseTransactions();
            useMiningStore.getState().setMiningControlsEnabled(true);
        }, 2000);
    } else {
        useBlockchainVisualisationStore.setState((curr) => ({
            recapIds: [...curr.recapIds, coinbase_transaction.tx_id],
            displayBlockHeight: blockHeight,
            earnings: undefined,
        }));
    }
};
const handleFail = async (blockHeight: number, balance: WalletBalance, canAnimate: boolean) => {
    if (canAnimate) {
        useMiningStore.getState().setMiningControlsEnabled(false);
        setAnimationState('fail');
        setTimeout(() => {
            useBlockchainVisualisationStore.setState({ displayBlockHeight: blockHeight });
            useWalletStore.getState().setWalletBalance(balance);
            useMiningStore.getState().setMiningControlsEnabled(true);
        }, 1000);
    } else {
        useBlockchainVisualisationStore.setState({ displayBlockHeight: blockHeight });
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
export const handleNewBlock = async (payload: {
    block_height: number;
    coinbase_transaction?: TransactionInfo;
    balance: WalletBalance;
}) => {
    if (useMiningStore.getState().miningInitiated) {
        const minimized = await appWindow?.isMinimized();
        const documentIsVisible = document?.visibilityState === 'visible' || false;
        const canAnimate = !minimized && documentIsVisible;

        if (payload.coinbase_transaction) {
            await handleWin(payload.coinbase_transaction, payload.balance, canAnimate);
        } else {
            await handleFail(payload.block_height, payload.balance, canAnimate);
        }
    } else {
        useBlockchainVisualisationStore.setState({ displayBlockHeight: payload.block_height });
    }
};
