import { invoke } from '@tauri-apps/api';
import { create } from './create';
import { P2poolStats, P2poolStatsResult } from '../types/app-status.ts';

type State = Partial<P2poolStatsResult>;

interface Actions {
    randomx_stats?: P2poolStats;
    sha3x_stats?: P2poolStats;
    fetchP2poolStats: () => Promise<void>;
}

type P2poolStatsStoreState = State & Actions;

const initialState: State = {
    connected: false,
    peer_count: 0,
    connection_info: {
        listener_addresses: [],
        connected_peers: 0,
        network_info: {
            num_peers: 0,
            connection_counters: {
                pending_incoming: 0,
                pending_outgoing: 0,
                established_incoming: 0,
                established_outgoing: 0,
            },
        },
    },
    connected_since: undefined,
    randomx_stats: undefined,
    sha3x_stats: undefined,
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
