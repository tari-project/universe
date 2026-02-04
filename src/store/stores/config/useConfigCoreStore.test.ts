import { describe, it, expect } from 'vitest';
import { ShutdownMode } from '@app/types/config/core';

describe('useConfigCoreStore', () => {
    describe('ConfigCore initial state', () => {
        const initialState = {
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
            shutdown_mode: ShutdownMode.Tasktray,
        };

        it('has allow_notifications as true by default', () => {
            expect(initialState.allow_notifications).toBe(true);
        });

        it('has allow_telemetry as false by default (privacy-first)', () => {
            expect(initialState.allow_telemetry).toBe(false);
        });

        it('has auto_update as false by default', () => {
            expect(initialState.auto_update).toBe(false);
        });

        it('has pre_release as false by default', () => {
            expect(initialState.pre_release).toBe(false);
        });

        it('has should_auto_launch as false by default', () => {
            expect(initialState.should_auto_launch).toBe(false);
        });

        it('has use_tor as false by default', () => {
            expect(initialState.use_tor).toBe(false);
        });

        it('has empty mmproxy_monero_nodes array by default', () => {
            expect(initialState.mmproxy_monero_nodes).toEqual([]);
        });

        it('has mmproxy_use_monero_failover as false by default', () => {
            expect(initialState.mmproxy_use_monero_failover).toBe(false);
        });

        it('has null scheduler_events by default', () => {
            expect(initialState.scheduler_events).toBeNull();
        });

        it('has Tasktray as default shutdown mode', () => {
            expect(initialState.shutdown_mode).toBe(ShutdownMode.Tasktray);
        });

        it('has undefined airdrop_tokens by default', () => {
            expect(initialState.airdrop_tokens).toBeUndefined();
        });

        it('has undefined exchange_id by default', () => {
            expect(initialState.exchange_id).toBeUndefined();
        });
    });

    describe('ShutdownMode enum', () => {
        it('has Direct mode', () => {
            expect(ShutdownMode.Direct).toBe('Direct');
        });

        it('has Tasktray mode', () => {
            expect(ShutdownMode.Tasktray).toBe('Tasktray');
        });
    });

    describe('SCHEDULER_EVENT_ID constant', () => {
        const SCHEDULER_EVENT_ID = 'mining_schedule';

        it('has correct value', () => {
            expect(SCHEDULER_EVENT_ID).toBe('mining_schedule');
        });
    });
});
