let winTimeout: NodeJS.Timeout | undefined;
let failTimeout: NodeJS.Timeout | undefined;
import { create } from './create';
import { useMiningStore } from './useMiningStore.ts';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { BlockTimeData } from '@app/types/mining.ts';
import { setAnimationState } from '@app/visuals.ts';
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
    rewardCount?: number;
    recapIds: TransactionInfo['tx_id'][];
    replayItem?: TransactionInfo;
}

interface Actions {
    setDisplayBlockHeight: (displayBlockHeight: number) => void;
    setDisplayBlockTime: (displayBlockTime: BlockTimeData) => void;
    setDebugBlockTime: (displayBlockTime: BlockTimeData) => void;
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

    setDisplayBlockHeight: (displayBlockHeight) => set({ displayBlockHeight }),
    setDisplayBlockTime: (displayBlockTime) => set({ displayBlockTime }),
    setDebugBlockTime: (debugBlockTime) => set({ debugBlockTime }),
    setRecapCount: (recapCount) => set({ recapCount }),
    setRewardCount: (rewardCount) => set({ rewardCount }),
}));

function selectAudioAssetOnSuccessTier(tier: number) {
    switch (tier) {
        case 1:
            return 'assets/Success_Level_01.wav';
        case 2:
            return 'assets/Success_Level_02.wav';
        case 3:
            return 'assets/Success_Level_03.wav';
        default:
            throw new Error('Invalid tier');
    }
}

function getAudioElementId(tier: number) {
    switch (tier) {
        case 1:
            return 'success1-player';
        case 2:
            return 'success2-player';
        case 3:
            return 'success3-player';
        default:
            throw new Error('Invalid tier');
    }
}

async function playNotificationAudio() {
    playAudio('notification-player', 'assets/Notification.wav');
}

async function playBlockWinAudio(successTier: number) {
    const asset = selectAudioAssetOnSuccessTier(successTier);
    const player = getAudioElementId(successTier);
    playAudio(player, asset);
}

const playAudio = async (eleId: string, track: string) => {
    try {
        const { audio_enabled, isAudioFeatureEnabled } = useAppConfigStore.getState();
        if (!audio_enabled || !isAudioFeatureEnabled) {
            return;
        }

        const blockWinAudioElement = document.getElementById(eleId) as HTMLAudioElement;
        if (!blockWinAudioElement) {
            throw new Error(`Audio element with id ${eleId} not found`);
        }

        const blobUrl = URL.createObjectURL(await fetch(track).then((res) => res.blob()));
        if (blockWinAudioElement) {
            blockWinAudioElement.setAttribute('src', blobUrl); // Required to make it work on an AppImage bundle
        }

        if (blockWinAudioElement.currentTime !== 0) return;
        blockWinAudioElement.onended = () => {
            blockWinAudioElement.currentTime = 0;
            URL.revokeObjectURL(blobUrl);
        };
        blockWinAudioElement.play();
    } catch (err) {
        console.error(`Failed to play block win sound: ${err}`);
    }
};

export const initAnimationAudio = () => {
    window.glApp.initAudio(playNotificationAudio, (tier: number) => playBlockWinAudio(tier));
};

const handleWin = async (coinbase_transaction: TransactionInfo, balance: WalletBalance, canAnimate: boolean) => {
    const blockHeight = Number(coinbase_transaction?.mined_in_block_height);
    const earnings = coinbase_transaction.amount;

    console.info(`Block #${blockHeight} mined! Earnings: ${earnings}`);
    const successTier = getSuccessTier(earnings);

    useBlockchainVisualisationStore.setState((curr) => ({ rewardCount: (curr.rewardCount || 0) + 1 }));
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
