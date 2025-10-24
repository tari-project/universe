import { create } from 'zustand';
import { ConfigCore } from '@app/types/config/core.ts';

const initialState: ConfigCore = {
    airdrop_tokens: undefined,
    allow_notifications: true,
    allow_telemetry: false,
    anon_id: '',
    auto_update: false,
    created_at: '',
    exchange_id: undefined,
    last_binaries_update_timestamp: '',
    last_changelog_version: '',
    mmproxy_monero_nodes: [],
    mmproxy_use_monero_failover: false,
    pre_release: false,
    remote_base_node_address: '',
    should_auto_launch: false,
    use_tor: false,
    scheduler_events: null,
};
export const useConfigCoreStore = create<ConfigCore>()(() => ({
    ...initialState,
}));
