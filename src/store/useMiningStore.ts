import { MinerMetrics } from '@app/types/app-status';
import { create } from './create';

import { BlockTimeData } from '@app/types/mining.ts';
import { invoke } from '@tauri-apps/api';
import { useAppStateStore } from './appStateStore';
import { useAppConfigStore } from './useAppConfigStore';
import { modeType } from './types';
import { setAnimationState } from '@app/visuals';

interface State extends MinerMetrics {
    displayBlockTime?: BlockTimeData;
    earnings?: number;
    postBlockAnimation?: boolean;
    timerPaused?: boolean;
    displayBlockHeight?: number;
    hashrateReady?: boolean;
    miningInitiated: boolean;
    miningControlsEnabled: boolean;
    isChangingMode: boolean;
}

interface Actions {
    fetchMiningMetrics: () => Promise<void>;
    startMining: () => Promise<void>;
    stopMining: () => Promise<void>;
    pauseMining: () => Promise<void>;
    changeMiningMode: (mode: modeType) => Promise<void>;
    handleBlockMined: () => void;
    setMiningControlsEnabled: (miningControlsEnabled: boolean) => void;
    setPostBlockAnimation: (postBlockAnimation: boolean) => void;
    setEarnings: (earnings?: number) => void;
    setTimerPaused: (timerPaused: boolean) => void;
    setDisplayBlockHeight: (displayBlockHeight: number) => void;
    setDisplayBlockTime: (displayBlockHeight: BlockTimeData) => void;
    setIsChangingMode: (isChangingMode: boolean) => void;
}
type MiningStoreState = State & Actions;

const initialState: State = {
    displayBlockHeight: undefined,
    timerPaused: false,
    postBlockAnimation: false,
    hashrateReady: false,
    miningInitiated: false,
    isChangingMode: false,
    miningControlsEnabled: true,
    cpu: {
        hardware: undefined,
        mining: {
            is_mining: false,
            hash_rate: 0,
            estimated_earnings: 0,
            connection: { is_connected: false },
        },
    },
    gpu: {
        hardware: undefined,
        mining: {
            is_mining: false,
            hash_rate: 0,
            estimated_earnings: 0,
            is_available: false,
        },
    },
    base_node: {
        block_height: 0,
        block_time: 0,
        is_synced: false,
        is_connected: false,
        connected_peers: [],
    },
};

export const useMiningStore = create<MiningStoreState>()((set, getState) => ({
    ...initialState,
    fetchMiningMetrics: async () => {
        try {
            const metrics = await invoke('get_miner_metrics');
            const isMining = metrics.cpu?.mining.is_mining || metrics.gpu?.mining.is_mining;
            // Pause animation when lost connection to the Tari Network
            if (isMining && !metrics.base_node?.is_connected && getState().base_node?.is_connected) {
                setAnimationState('pause');
            } else if (isMining && metrics.base_node?.is_connected && !getState().base_node?.is_connected) {
                setAnimationState('resume');
            }

            set(metrics);
        } catch (e) {
            console.error(e);
        }
    },
    handleBlockMined: () => {
        set({
            postBlockAnimation: true,
            timerPaused: false,
            earnings: undefined,
        });
    },
    startMining: async () => {
        console.info('Mining starting....');
        set({ miningInitiated: true });
        try {
            await invoke('start_mining', {});
        } catch (e) {
            const appStateStore = useAppStateStore.getState();
            console.error(e);
            appStateStore.setError(e as string);
            set({ miningInitiated: false });
        }
    },
    stopMining: async () => {
        console.info('Mining stopping...');
        set({ miningInitiated: false });
        try {
            await invoke('stop_mining', {});
        } catch (e) {
            const appStateStore = useAppStateStore.getState();
            console.error(e);
            appStateStore.setError(e as string);
            set({ miningInitiated: true });
        }
    },
    pauseMining: async () => {
        console.info('Mining pausing...');
        try {
            await invoke('stop_mining', {});
        } catch (e) {
            const appStateStore = useAppStateStore.getState();
            console.error(e);
            appStateStore.setError(e as string);
            set({ miningInitiated: true });
        }
    },
    changeMiningMode: async (mode: modeType) => {
        console.info('Changing mode...');
        const state = getState();

        set({ isChangingMode: true });
        if (state.cpu.mining.is_mining || state.gpu.mining.is_mining) {
            await state.pauseMining();
        }
        try {
            const appConfigState = useAppConfigStore.getState();
            await appConfigState.setMode(mode as modeType);
            if (state.miningInitiated) {
                await state.startMining();
            }
        } catch (e) {
            console.error(e);
            set({ isChangingMode: false });
        }
    },
    setMiningControlsEnabled: (miningControlsEnabled) => set({ miningControlsEnabled }),
    setPostBlockAnimation: (postBlockAnimation) => set({ postBlockAnimation }),
    setEarnings: (earnings) => set({ earnings }),
    setTimerPaused: (timerPaused) => set({ timerPaused }),
    setDisplayBlockHeight: (displayBlockHeight) => set({ displayBlockHeight }),
    setDisplayBlockTime: (displayBlockTime) => set({ displayBlockTime }),
    setIsChangingMode: (isChangingMode) => set({ isChangingMode }),
}));
