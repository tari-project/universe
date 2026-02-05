import { describe, it, expect, beforeEach } from 'vitest';
import {
    useNodeStore,
    setNodeStoreState,
    updateNodeType,
    setTorEntryGuards,
    setBackgroundNodeState,
} from './useNodeStore';
import type { NodeType } from '@app/types/mining/node';

describe('useNodeStore', () => {
    beforeEach(() => {
        useNodeStore.setState({
            node_type: undefined,
            node_identity: {
                public_key: '',
                public_addresses: [],
            },
            node_connection_address: '',
            tor_entry_guards: [],
            isNodeConnected: false,
            base_node_status: undefined,
            backgroundNodeSyncLastUpdate: undefined,
        });
    });

    describe('initial state', () => {
        it('has undefined node_type', () => {
            expect(useNodeStore.getState().node_type).toBeUndefined();
        });

        it('has empty node_identity', () => {
            const identity = useNodeStore.getState().node_identity;
            expect(identity?.public_key).toBe('');
            expect(identity?.public_addresses).toEqual([]);
        });

        it('has empty node_connection_address', () => {
            expect(useNodeStore.getState().node_connection_address).toBe('');
        });

        it('has empty tor_entry_guards', () => {
            expect(useNodeStore.getState().tor_entry_guards).toEqual([]);
        });

        it('has isNodeConnected as false', () => {
            expect(useNodeStore.getState().isNodeConnected).toBe(false);
        });

        it('has undefined base_node_status', () => {
            expect(useNodeStore.getState().base_node_status).toBeUndefined();
        });
    });

    describe('setNodeStoreState', () => {
        it('can set node_type', () => {
            setNodeStoreState({ node_type: 'Local' });
            expect(useNodeStore.getState().node_type).toBe('Local');
        });

        it('can set node_connection_address', () => {
            setNodeStoreState({ node_connection_address: '127.0.0.1:18142' });
            expect(useNodeStore.getState().node_connection_address).toBe('127.0.0.1:18142');
        });

        it('can set isNodeConnected', () => {
            setNodeStoreState({ isNodeConnected: true });
            expect(useNodeStore.getState().isNodeConnected).toBe(true);
        });

        it('can set node_identity', () => {
            const identity = {
                public_key: 'abc123def456',
                public_addresses: ['127.0.0.1:18142', '192.168.1.1:18142'],
            };
            setNodeStoreState({ node_identity: identity });
            expect(useNodeStore.getState().node_identity).toEqual(identity);
        });

        it('preserves other state when updating', () => {
            setNodeStoreState({ node_type: 'Local' });
            setNodeStoreState({ isNodeConnected: true });

            expect(useNodeStore.getState().node_type).toBe('Local');
            expect(useNodeStore.getState().isNodeConnected).toBe(true);
        });
    });

    describe('updateNodeType', () => {
        it('sets node type and resets state', () => {
            // First set some state
            setNodeStoreState({
                node_connection_address: 'some-address',
                isNodeConnected: true,
            });

            // Update node type - should reset
            updateNodeType('Remote');

            expect(useNodeStore.getState().node_type).toBe('Remote');
            expect(useNodeStore.getState().node_connection_address).toBe('');
            expect(useNodeStore.getState().isNodeConnected).toBe(false);
        });

        it('can set to Local node type', () => {
            updateNodeType('Local');
            expect(useNodeStore.getState().node_type).toBe('Local');
        });

        it('can set to Remote node type', () => {
            updateNodeType('Remote');
            expect(useNodeStore.getState().node_type).toBe('Remote');
        });
    });

    describe('setTorEntryGuards', () => {
        it('filters and maps entry guards correctly', () => {
            const guards = ['guard1 up 100%', 'guard2 down 0%', 'guard3 up 95%'];
            setTorEntryGuards(guards);

            const result = useNodeStore.getState().tor_entry_guards;
            expect(result).toHaveLength(2);
            expect(result).toContain('guard1');
            expect(result).toContain('guard3');
            expect(result).not.toContain('guard2');
        });

        it('returns empty array when no guards are up', () => {
            const guards = ['guard1 down 0%', 'guard2 down 0%'];
            setTorEntryGuards(guards);

            expect(useNodeStore.getState().tor_entry_guards).toEqual([]);
        });

        it('handles empty array', () => {
            setTorEntryGuards([]);
            expect(useNodeStore.getState().tor_entry_guards).toEqual([]);
        });

        it('handles all guards up', () => {
            const guards = ['guard1 up 100%', 'guard2 up 100%', 'guard3 up 100%'];
            setTorEntryGuards(guards);

            expect(useNodeStore.getState().tor_entry_guards).toHaveLength(3);
        });
    });

    describe('setBackgroundNodeState', () => {
        it('sets background node sync update', () => {
            const payload = {
                block_height: 12345,
                progress: 50,
            };
            setBackgroundNodeState(payload as any);

            expect(useNodeStore.getState().backgroundNodeSyncLastUpdate).toEqual(payload);
        });

        it('does not update state if payload is equal', () => {
            const payload = {
                block_height: 12345,
                progress: 50,
            };
            setBackgroundNodeState(payload as any);
            const firstUpdate = useNodeStore.getState().backgroundNodeSyncLastUpdate;

            // Same payload again
            setBackgroundNodeState(payload as any);
            const secondUpdate = useNodeStore.getState().backgroundNodeSyncLastUpdate;

            // Should be the same reference (no update)
            expect(firstUpdate).toBe(secondUpdate);
        });

        it('updates state if payload is different', () => {
            const payload1 = {
                block_height: 12345,
                progress: 50,
            };
            setBackgroundNodeState(payload1 as any);

            const payload2 = {
                block_height: 12346,
                progress: 51,
            };
            setBackgroundNodeState(payload2 as any);

            expect(useNodeStore.getState().backgroundNodeSyncLastUpdate).toEqual(payload2);
        });
    });

    describe('node_identity state', () => {
        it('can set public key', () => {
            setNodeStoreState({
                node_identity: {
                    public_key: 'test-public-key-123',
                    public_addresses: [],
                },
            });
            expect(useNodeStore.getState().node_identity?.public_key).toBe('test-public-key-123');
        });

        it('can set public addresses', () => {
            const addresses = ['127.0.0.1:18142', '192.168.1.1:18142', 'onion-address.onion:18142'];
            setNodeStoreState({
                node_identity: {
                    public_key: 'key',
                    public_addresses: addresses,
                },
            });
            expect(useNodeStore.getState().node_identity?.public_addresses).toEqual(addresses);
        });
    });

    describe('base_node_status state', () => {
        it('can set base node status', () => {
            const status = {
                is_synced: true,
                block_height: 50000,
                block_time: 120,
            };
            setNodeStoreState({ base_node_status: status as any });
            expect(useNodeStore.getState().base_node_status).toBeDefined();
        });
    });

    describe('complex state updates', () => {
        it('can update multiple fields atomically', () => {
            setNodeStoreState({
                node_type: 'Local',
                isNodeConnected: true,
                node_connection_address: '127.0.0.1:18142',
            });

            const state = useNodeStore.getState();
            expect(state.node_type).toBe('Local');
            expect(state.isNodeConnected).toBe(true);
            expect(state.node_connection_address).toBe('127.0.0.1:18142');
        });
    });
});
