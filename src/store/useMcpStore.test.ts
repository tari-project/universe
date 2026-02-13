import { describe, it, expect, beforeEach } from 'vitest';
import {
    useMcpStore,
    setMcpServerStatus,
    addMcpAuditEntry,
    setMcpPendingTransaction,
    McpAuditEntry,
    McpPendingTransaction,
} from './useMcpStore';

describe('useMcpStore', () => {
    beforeEach(() => {
        useMcpStore.setState({
            serverRunning: false,
            serverPort: null,
            auditEntries: [],
            pendingTransaction: null,
        });
    });

    describe('initial state', () => {
        it('server is not running', () => {
            expect(useMcpStore.getState().serverRunning).toBe(false);
        });

        it('server port is null', () => {
            expect(useMcpStore.getState().serverPort).toBeNull();
        });

        it('audit entries is empty', () => {
            expect(useMcpStore.getState().auditEntries).toEqual([]);
        });

        it('no pending transaction', () => {
            expect(useMcpStore.getState().pendingTransaction).toBeNull();
        });
    });

    describe('setMcpServerStatus', () => {
        it('sets server running with port', () => {
            setMcpServerStatus(true, 19222);
            expect(useMcpStore.getState().serverRunning).toBe(true);
            expect(useMcpStore.getState().serverPort).toBe(19222);
        });

        it('sets server stopped', () => {
            setMcpServerStatus(true, 19222);
            setMcpServerStatus(false, null);
            expect(useMcpStore.getState().serverRunning).toBe(false);
            expect(useMcpStore.getState().serverPort).toBeNull();
        });

        it('updates port when server restarted on different port', () => {
            setMcpServerStatus(true, 19222);
            setMcpServerStatus(true, 8080);
            expect(useMcpStore.getState().serverPort).toBe(8080);
        });
    });

    describe('addMcpAuditEntry', () => {
        const makeEntry = (toolName: string, status: McpAuditEntry['status'] = 'Success'): McpAuditEntry => ({
            timestamp: new Date().toISOString(),
            tool_name: toolName,
            tier: 'read',
            status,
        });

        it('adds entry to the beginning', () => {
            addMcpAuditEntry(makeEntry('get_chain_status'));
            const entries = useMcpStore.getState().auditEntries;
            expect(entries).toHaveLength(1);
            expect(entries[0].tool_name).toBe('get_chain_status');
        });

        it('prepends new entries', () => {
            addMcpAuditEntry(makeEntry('first'));
            addMcpAuditEntry(makeEntry('second'));
            const entries = useMcpStore.getState().auditEntries;
            expect(entries[0].tool_name).toBe('second');
            expect(entries[1].tool_name).toBe('first');
        });

        it('limits entries to 500', () => {
            for (let i = 0; i < 510; i++) {
                addMcpAuditEntry(makeEntry(`tool_${i}`));
            }
            expect(useMcpStore.getState().auditEntries).toHaveLength(500);
        });

        it('keeps most recent entries when truncating', () => {
            for (let i = 0; i < 510; i++) {
                addMcpAuditEntry(makeEntry(`tool_${i}`));
            }
            const entries = useMcpStore.getState().auditEntries;
            expect(entries[0].tool_name).toBe('tool_509');
        });

        it('preserves all audit entry fields', () => {
            const entry: McpAuditEntry = {
                timestamp: '2024-01-15T12:00:00Z',
                tool_name: 'send_transaction',
                tier: 'transaction',
                status: 'Denied',
                duration_ms: 150,
                client_info: 'claude-code',
                details: 'User denied',
            };
            addMcpAuditEntry(entry);
            const stored = useMcpStore.getState().auditEntries[0];
            expect(stored).toEqual(entry);
        });

        it('handles all status types', () => {
            const statuses: McpAuditEntry['status'][] = ['Started', 'Success', 'Error', 'Denied', 'RateLimited'];
            statuses.forEach((status) => {
                addMcpAuditEntry(makeEntry('test', status));
            });
            expect(useMcpStore.getState().auditEntries).toHaveLength(5);
        });
    });

    describe('setMcpPendingTransaction', () => {
        const mockTransaction: McpPendingTransaction = {
            request_id: 'mcp_tx_123',
            destination: '5AexampleAddressHere1234567890abcdef',
            amount_micro_minotari: 1_500_000,
            amount_display: '1.5 XTM',
        };

        it('sets a pending transaction', () => {
            setMcpPendingTransaction(mockTransaction);
            expect(useMcpStore.getState().pendingTransaction).toEqual(mockTransaction);
        });

        it('clears pending transaction with null', () => {
            setMcpPendingTransaction(mockTransaction);
            setMcpPendingTransaction(null);
            expect(useMcpStore.getState().pendingTransaction).toBeNull();
        });

        it('replaces existing pending transaction', () => {
            setMcpPendingTransaction(mockTransaction);
            const newTransaction: McpPendingTransaction = {
                ...mockTransaction,
                request_id: 'mcp_tx_456',
                amount_display: '2.0 XTM',
            };
            setMcpPendingTransaction(newTransaction);
            expect(useMcpStore.getState().pendingTransaction?.request_id).toBe('mcp_tx_456');
        });
    });
});
