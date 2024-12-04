import { invoke } from '@tauri-apps/api';
import { create } from './create';
import { P2poolConnections, P2poolStats, P2poolStatsResult } from '../types/app-status.ts';

type State = Partial<P2poolStatsResult & P2poolConnections>;

interface Actions {
    randomx_stats?: P2poolStats;
    sha3x_stats?: P2poolStats;
    fetchP2poolStats: () => Promise<void>;
    fetchP2poolConnections: () => Promise<void>;
}

type P2poolStatsStoreState = State & Actions;

const initialState: State = {
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
    peers: [],
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
    fetchP2poolConnections: async () => {
        try {
            const connections = await invoke('get_p2pool_connections');
            set(connections);
        } catch (e) {
            console.error('Could not get p2p connections: ', e);
        }
    },
}));
