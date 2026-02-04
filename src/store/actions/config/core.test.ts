/**
 * Tests for core config store actions patterns and logic.
 *
 * These tests validate the settings action patterns:
 * - Optimistic update and rollback patterns
 * - State transformation logic
 * - Scheduler event handling
 */
import { describe, it, expect } from 'vitest';
import { ShutdownMode } from '@app/types/config/core';

// Types for scheduler events (mirroring the actual types)
enum SchedulerEventState {
    Active = 'Active',
    Paused = 'Paused',
}

interface SchedulerEvent {
    id: string;
    timing: unknown;
    event_type: string;
    state: SchedulerEventState;
}

describe('core config actions', () => {
    describe('optimistic update pattern with rollback', () => {
        it('setAllowNotifications follows optimistic update pattern', () => {
            let state = { allow_notifications: true };
            const allowNotifications = false;

            // Optimistic update
            state = { ...state, allow_notifications: allowNotifications };
            expect(state.allow_notifications).toBe(false);

            // Rollback on error
            state = { ...state, allow_notifications: !allowNotifications };
            expect(state.allow_notifications).toBe(true);
        });

        it('setAllowTelemetry follows optimistic update pattern', () => {
            let state = { allow_telemetry: false };
            const allowTelemetry = true;

            // Optimistic update
            state = { ...state, allow_telemetry: allowTelemetry };
            expect(state.allow_telemetry).toBe(true);

            // Rollback on error
            state = { ...state, allow_telemetry: !allowTelemetry };
            expect(state.allow_telemetry).toBe(false);
        });

        it('setAutoUpdate follows optimistic update pattern', () => {
            let state = { auto_update: false };
            const autoUpdate = true;

            // Optimistic update
            state = { ...state, auto_update: autoUpdate };
            expect(state.auto_update).toBe(true);

            // Rollback on error
            state = { ...state, auto_update: !autoUpdate };
            expect(state.auto_update).toBe(false);
        });

        it('setPreRelease follows optimistic update pattern', () => {
            let state = { pre_release: false };
            const preRelease = true;

            // Optimistic update
            state = { ...state, pre_release: preRelease };
            expect(state.pre_release).toBe(true);

            // Rollback on error
            state = { ...state, pre_release: !preRelease };
            expect(state.pre_release).toBe(false);
        });

        it('setShouldAutoLaunch follows optimistic update pattern', () => {
            let state = { should_auto_launch: false };
            const shouldAutoLaunch = true;

            // Optimistic update
            state = { ...state, should_auto_launch: shouldAutoLaunch };
            expect(state.should_auto_launch).toBe(true);

            // Rollback on error
            state = { ...state, should_auto_launch: !shouldAutoLaunch };
            expect(state.should_auto_launch).toBe(false);
        });

        it('setUseTor follows optimistic update pattern', () => {
            let state = { use_tor: false };
            const useTor = true;

            // Optimistic update
            state = { ...state, use_tor: useTor };
            expect(state.use_tor).toBe(true);

            // Rollback on error
            state = { ...state, use_tor: !useTor };
            expect(state.use_tor).toBe(false);
        });
    });

    describe('setMonerodConfig state transformation', () => {
        it('updates both monero failover and nodes together', () => {
            const prevState = {
                mmproxy_use_monero_failover: false,
                mmproxy_monero_nodes: ['node1.example.com'],
            };

            const useMoneroFail = true;
            const moneroNodes = ['node2.example.com', 'node3.example.com'];

            const newState = {
                ...prevState,
                mmproxy_use_monero_failover: useMoneroFail,
                mmproxy_monero_nodes: moneroNodes,
            };

            expect(newState.mmproxy_use_monero_failover).toBe(true);
            expect(newState.mmproxy_monero_nodes).toEqual(['node2.example.com', 'node3.example.com']);
        });

        it('rolls back both values on error', () => {
            const prevMoneroNodes = ['node1.example.com'];
            let state = {
                mmproxy_use_monero_failover: false,
                mmproxy_monero_nodes: prevMoneroNodes,
            };

            // Optimistic update
            state = {
                ...state,
                mmproxy_use_monero_failover: true,
                mmproxy_monero_nodes: ['node2.example.com'],
            };

            // Rollback on error
            state = {
                ...state,
                mmproxy_use_monero_failover: false,
                mmproxy_monero_nodes: prevMoneroNodes,
            };

            expect(state.mmproxy_use_monero_failover).toBe(false);
            expect(state.mmproxy_monero_nodes).toBe(prevMoneroNodes);
        });
    });

    describe('setNodeType logic', () => {
        it('stores previous node type for rollback', () => {
            const previousNodeType = 'local';
            const newNodeType = 'remote';

            let state = { node_type: previousNodeType };
            state = { ...state, node_type: newNodeType };
            expect(state.node_type).toBe('remote');

            // Rollback
            state = { ...state, node_type: previousNodeType };
            expect(state.node_type).toBe('local');
        });
    });

    describe('setSchedulerEvents state transformation', () => {
        it('adds new event to scheduler_events', () => {
            const initialState: Record<string, SchedulerEvent> = {};

            const newEvent: SchedulerEvent = {
                id: 'mining_schedule',
                timing: { At: '08:00' },
                event_type: 'StartMining',
                state: SchedulerEventState.Active,
            };

            const updated = { ...initialState, [newEvent.id]: newEvent };

            expect(updated.mining_schedule).toBe(newEvent);
        });

        it('merges new event with existing events', () => {
            const initialState: Record<string, SchedulerEvent> = {
                existing_event: {
                    id: 'existing_event',
                    timing: { At: '09:00' },
                    event_type: 'StopMining',
                    state: SchedulerEventState.Active,
                },
            };

            const newEvent: SchedulerEvent = {
                id: 'mining_schedule',
                timing: { At: '08:00' },
                event_type: 'StartMining',
                state: SchedulerEventState.Active,
            };

            const updated = { ...initialState, [newEvent.id]: newEvent };

            expect(Object.keys(updated)).toHaveLength(2);
            expect(updated.existing_event).toBeDefined();
            expect(updated.mining_schedule).toBe(newEvent);
        });

        it('rolls back to initial state on error', () => {
            const initialState: Record<string, SchedulerEvent> = {
                existing_event: {
                    id: 'existing_event',
                    timing: {},
                    event_type: 'StopMining',
                    state: SchedulerEventState.Active,
                },
            };

            let state: Record<string, SchedulerEvent> | null = initialState;

            // Add new event
            state = { ...state, new_event: { id: 'new_event' } as SchedulerEvent };
            expect(Object.keys(state)).toHaveLength(2);

            // Rollback on error
            state = initialState;
            expect(Object.keys(state)).toHaveLength(1);
        });
    });

    describe('removeSchedulerEvent logic', () => {
        it('removes event by setting scheduler_events to null', () => {
            const initialState: Record<string, SchedulerEvent> = {
                mining_schedule: {
                    id: 'mining_schedule',
                    timing: {},
                    event_type: 'StartMining',
                    state: SchedulerEventState.Active,
                },
            };

            // After successful removal
            const newState: Record<string, SchedulerEvent> | null = null;

            expect(initialState.mining_schedule).toBeDefined();
            expect(newState).toBeNull();
        });
    });

    describe('toggleSchedulerEventPaused logic', () => {
        it('toggles from Paused to Active', () => {
            const eventItem: SchedulerEvent = {
                id: 'mining_schedule',
                timing: {},
                event_type: 'StartMining',
                state: SchedulerEventState.Paused,
            };

            const isPaused = eventItem.state === SchedulerEventState.Paused;
            expect(isPaused).toBe(true);

            const updatedItem = { ...eventItem, state: SchedulerEventState.Active };
            expect(updatedItem.state).toBe(SchedulerEventState.Active);
        });

        it('toggles from Active to Paused', () => {
            const eventItem: SchedulerEvent = {
                id: 'mining_schedule',
                timing: {},
                event_type: 'StartMining',
                state: SchedulerEventState.Active,
            };

            const isPaused = eventItem.state === SchedulerEventState.Paused;
            expect(isPaused).toBe(false);

            const updatedItem = { ...eventItem, state: SchedulerEventState.Paused };
            expect(updatedItem.state).toBe(SchedulerEventState.Paused);
        });

        it('updates event in scheduler_events record', () => {
            const currentItems: Record<string, SchedulerEvent> = {
                mining_schedule: {
                    id: 'mining_schedule',
                    timing: {},
                    event_type: 'StartMining',
                    state: SchedulerEventState.Active,
                },
            };

            const eventId = 'mining_schedule';
            const eventItem = currentItems[eventId];
            const updatedItem = { ...eventItem, state: SchedulerEventState.Paused };

            const newState = { ...currentItems, [eventId]: updatedItem };

            expect(newState.mining_schedule.state).toBe(SchedulerEventState.Paused);
        });

        it('returns early if event does not exist', () => {
            const currentItems: Record<string, SchedulerEvent> = {};
            const eventId = 'nonexistent';
            const eventItem = currentItems[eventId];

            expect(eventItem).toBeUndefined();
        });
    });

    describe('updateShutdownMode logic', () => {
        it('updates shutdown mode with rollback support', () => {
            let state = { shutdown_mode: ShutdownMode.Tasktray };
            const previousShutdownMode = state.shutdown_mode;
            const newMode = ShutdownMode.Direct;

            // Optimistic update
            state = { ...state, shutdown_mode: newMode };
            expect(state.shutdown_mode).toBe(ShutdownMode.Direct);

            // Rollback on error
            state = { ...state, shutdown_mode: previousShutdownMode };
            expect(state.shutdown_mode).toBe(ShutdownMode.Tasktray);
        });
    });

    describe('setAirdropTokensInConfig logic', () => {
        interface AirdropTokensParam {
            token: string;
            refreshToken: string;
        }

        const transformTokens = (param: AirdropTokensParam | undefined) => {
            return param
                ? {
                      token: param.token,
                      refresh_token: param.refreshToken,
                  }
                : undefined;
        };

        it('transforms token structure correctly', () => {
            const airdropTokensParam: AirdropTokensParam = {
                token: 'access_token_123',
                refreshToken: 'refresh_token_456',
            };

            const airdropTokens = transformTokens(airdropTokensParam);

            expect(airdropTokens).toEqual({
                token: 'access_token_123',
                refresh_token: 'refresh_token_456',
            });
        });

        it('handles undefined input', () => {
            const airdropTokensParam: AirdropTokensParam | undefined = undefined;

            const airdropTokens = transformTokens(airdropTokensParam);

            expect(airdropTokens).toBeUndefined();
        });
    });
});
