let winTimeout: NodeJS.Timeout | undefined;
let failTimeout: NodeJS.Timeout | undefined;
import { create } from './create';
import { useMiningStore } from './useMiningStore.ts';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { BlockTimeData } from '@app/types/mining.ts';
import { setAnimationComplete, setAnimationState } from '@app/visuals.ts';
import { TransactionInfo, WalletBalance } from '@app/types/app-status.ts';
import { useWalletStore } from './useWalletStore.ts';
import { useAppConfigStore } from './useAppConfigStore.ts';
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
    isPlayingAudio: boolean;
}

interface Actions {
    setDisplayBlockHeight: (displayBlockHeight: number) => void;
    setDisplayBlockTime: (displayBlockTime: BlockTimeData) => void;
    setDebugBlockTime: (displayBlockTime: BlockTimeData) => void;
    setRecapCount: (recapCount?: number) => void;
    setIsPlayingAudio: (isPlayingAudio: boolean) => void;
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
    isPlayingAudio: false,

    setDisplayBlockHeight: (displayBlockHeight) => set({ displayBlockHeight }),
    setDisplayBlockTime: (displayBlockTime) => set({ displayBlockTime }),
    setDebugBlockTime: (debugBlockTime) => set({ debugBlockTime }),
    setRecapCount: (recapCount) => set({ recapCount }),
    setIsPlayingAudio: (isPlayingAudio) => set({ isPlayingAudio }),
}));

async function playNotificationAudio() {
    try {
        const audioEnabled = useAppConfigStore.getState().audio_enabled;
        const isPlayingAudio = useBlockchainVisualisationStore.getState().isPlayingAudio;
        if (!audioEnabled || isPlayingAudio) {
            return;
        }

        const asset = 'assets/Notification.wav';
        const blobUrl = URL.createObjectURL(await fetch(asset).then((res) => res.blob()));
        const audioElement = new Audio(blobUrl);
        if (!audioElement) {
            console.error('Audio element not found');
            return;
        }

        audioElement.currentTime = 0;
        audioElement.onplay = () => useBlockchainVisualisationStore.getState().setIsPlayingAudio(true);
        audioElement.onended = () => useBlockchainVisualisationStore.getState().setIsPlayingAudio(false);
        audioElement.play();
    } catch (err) {
        console.error(`Failed to play block win sound: ${err}`);
    }
}

function selectAudioAssetOnSuccessTier(tier: string) {
    if (tier === 'success') {
        return 'assets/Success_Level_01.wav';
    } else if (tier === 'success2') {
        return 'assets/Success_Level_02.wav';
    } else if (tier === 'success3') {
        return 'assets/Success_Level_03.wav';
    } else {
        throw new Error('Invalid tier');
    }
}

async function playBlockWinAudio(successTier: string) {
    try {
        const audioEnabled = useAppConfigStore.getState().audio_enabled;
        const isPlayingAudio = useBlockchainVisualisationStore.getState().isPlayingAudio;
        if (!audioEnabled || isPlayingAudio) {
            //return;
        }

        const asset = selectAudioAssetOnSuccessTier(successTier);
        const blobUrl = URL.createObjectURL(await fetch(asset).then((res) => res.blob()));
        const audioElement = new Audio(blobUrl);
        if (!audioElement) {
            console.error('Audio element not found');
            return;
        }

        audioElement.currentTime = 0;
        audioElement.onplay = () => useBlockchainVisualisationStore.getState().setIsPlayingAudio(true);
        audioElement.onended = () => useBlockchainVisualisationStore.getState().setIsPlayingAudio(false);
        audioElement.play();
    } catch (err) {
        console.error(`Failed to play block win sound: ${err}`);
    }
}

const handleWin = async (coinbase_transaction: TransactionInfo, balance: WalletBalance, canAnimate: boolean) => {
    const blockHeight = Number(coinbase_transaction?.mined_in_block_height);
    const earnings = coinbase_transaction.amount;

    console.info(`Block #${blockHeight} mined! Earnings: ${earnings}`);
    const successTier = getSuccessTier(earnings);

    if (canAnimate) {
        useMiningStore.getState().setMiningControlsEnabled(false);

        setAnimationState(successTier);
        useBlockchainVisualisationStore.setState({ earnings });
        if (winTimeout) {
            clearTimeout(winTimeout);
        }
        winTimeout = setTimeout(() => {
            useBlockchainVisualisationStore.setState({ displayBlockHeight: blockHeight, earnings: undefined });
            useWalletStore.getState().setWalletBalance(balance);
            useWalletStore.getState().refreshCoinbaseTransactions();
            useMiningStore.getState().setMiningControlsEnabled(true);
        }, 2000);
    } else {
        await useWalletStore.getState().refreshCoinbaseTransactions();
        useBlockchainVisualisationStore.setState((curr) => ({
            recapIds: [...curr.recapIds, coinbase_transaction.tx_id],
            displayBlockHeight: blockHeight,
            earnings: undefined,
        }));
    }
    playNotificationAudio();
    setTimeout(() => playBlockWinAudio(successTier), 2500);
};
const handleFail = async (blockHeight: number, balance: WalletBalance, canAnimate: boolean) => {
    if (canAnimate) {
        useMiningStore.getState().setMiningControlsEnabled(false);
        setAnimationState('fail');
        if (failTimeout) {
            clearTimeout(failTimeout);
        }
        failTimeout = setTimeout(() => {
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
    setAnimationComplete(3, true);
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
    playNotificationAudio();
    setTimeout(() => playBlockWinAudio(successTier), 2500);
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
