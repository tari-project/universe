import { invoke } from '@tauri-apps/api/core';
import { create } from './create';
import { P2poolConnections, P2poolStatsResult } from '../types/app-status.ts';

type P2poolStatsStoreState = Partial<P2poolStatsResult> & Partial<P2poolConnections>;

const initialState: P2poolStatsStoreState = {
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

export const useP2poolStatsStore = create<P2poolStatsStoreState>()(() => ({
    ...initialState,
}));

export const fetchP2poolStats = async () => {
    try {
        const stats = await invoke('get_p2pool_stats');
        useP2poolStatsStore.setState({ ...stats });
    } catch (e) {
        console.error('Could not get p2p stats: ', e);
    }
};
export const fetchP2poolConnections = async () => {
    try {
        const connections = await invoke('get_p2pool_connections');
        useP2poolStatsStore.setState({ peers: connections.peers });
    } catch (e) {
        console.error('Could not get p2p connections: ', e);
    }
};
