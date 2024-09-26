import { invoke } from '@tauri-apps/api';
import { create } from './create';
import { P2poolStats, P2poolStatsResult } from '../types/app-status.ts';

type State = Partial<P2poolStatsResult>;

interface Actions {
    randomx?: P2poolStats;
    sha3?: P2poolStats;
    fetchP2poolStats: () => Promise<void>;
}

type P2poolStatsStoreState = State & Actions;

const initialState: State = {
    randomx: undefined,
    sha3: undefined,
};

export const useP2poolStatsStore = create<P2poolStatsStoreState>()((set) => ({
    ...initialState,
    fetchP2poolStats: async () => {
        try {
            const stats = await invoke('get_p2pool_stats');
            set(stats);
        } catch (e) {
            console.error('Could not get p2p stats: ', e);
        }
    },
}));
