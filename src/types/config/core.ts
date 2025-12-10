import { NodeType } from '../mining/node.ts';
import { SchedulerEvent } from '@app/types/mining/schedule.ts';

export interface ConfigCore {
    airdrop_tokens?: {
        token: string;
        refreshToken: string;
    };
    allow_notifications: boolean;
    allow_telemetry: boolean;
    anon_id: string;
    auto_update: boolean;
    created_at: string;
    exchange_id?: string;
    last_binaries_update_timestamp?: string;
    last_changelog_version: string;
    mmproxy_monero_nodes: string[];
    mmproxy_use_monero_failover: boolean;
    node_type?: NodeType;
    pre_release: boolean;
    remote_base_node_address: string;
    scheduler_events?: Record<string, SchedulerEvent> | null;
    should_auto_launch: boolean;
    use_tor: boolean;
    shutdown_mode: ShutdownMode;
    directories?: CustomDirectoryItems;
}
export enum ShutdownMode {
    Direct = 'Direct',
    Tasktray = 'Tasktray',
}

export enum CustomDirectory {
    ChainData = 'ChainData',
    Config = 'Config',
    Logs = 'Logs',
}

export interface Directory {
    directoryType: CustomDirectory;
    path: string;
}

export type CustomDirectoryItems = Partial<Record<CustomDirectory, string>>;
