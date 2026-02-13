/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@app/test/test-utils';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useMcpStore, McpAuditEntry } from '@app/store/useMcpStore';
import AuditLog from './AuditLog';

describe('AuditLog', () => {
    beforeEach(() => {
        useConfigMcpStore.setState({ enabled: false });
        useMcpStore.setState({ auditEntries: [] });
    });

    it('returns null when MCP is disabled', () => {
        const { container } = render(<AuditLog />);
        expect(container.firstChild).toBeNull();
    });

    it('renders when MCP is enabled', () => {
        useConfigMcpStore.setState({ enabled: true });
        render(<AuditLog />);
        expect(screen.getByText('mcp.audit-log.title')).toBeInTheDocument();
    });

    it('shows empty message when no entries', () => {
        useConfigMcpStore.setState({ enabled: true });
        render(<AuditLog />);
        expect(screen.getByText('mcp.audit-log.empty')).toBeInTheDocument();
    });

    it('renders audit entries', () => {
        const entries: McpAuditEntry[] = [
            {
                timestamp: '2024-01-15T12:00:00Z',
                tool_name: 'get_chain_status',
                tier: 'read',
                status: 'Success',
                duration_ms: 50,
            },
        ];
        useConfigMcpStore.setState({ enabled: true });
        useMcpStore.setState({ auditEntries: entries });
        render(<AuditLog />);
        expect(screen.getByText('get_chain_status')).toBeInTheDocument();
    });

    it('shows tier label for entries', () => {
        const entries: McpAuditEntry[] = [
            {
                timestamp: '2024-01-15T12:00:00Z',
                tool_name: 'send_transaction',
                tier: 'transaction',
                status: 'Denied',
            },
        ];
        useConfigMcpStore.setState({ enabled: true });
        useMcpStore.setState({ auditEntries: entries });
        render(<AuditLog />);
        expect(screen.getByText('[transaction]')).toBeInTheDocument();
    });

    it('shows status icon for success', () => {
        const entries: McpAuditEntry[] = [
            {
                timestamp: '2024-01-15T12:00:00Z',
                tool_name: 'test_tool',
                tier: 'read',
                status: 'Success',
            },
        ];
        useConfigMcpStore.setState({ enabled: true });
        useMcpStore.setState({ auditEntries: entries });
        render(<AuditLog />);
        expect(screen.getByText('✅')).toBeInTheDocument();
    });

    it('shows export button when entries exist', () => {
        const entries: McpAuditEntry[] = [
            {
                timestamp: '2024-01-15T12:00:00Z',
                tool_name: 'test_tool',
                tier: 'read',
                status: 'Success',
            },
        ];
        useConfigMcpStore.setState({ enabled: true });
        useMcpStore.setState({ auditEntries: entries });
        render(<AuditLog />);
        expect(screen.getByText('mcp.audit-log.export')).toBeInTheDocument();
    });

    it('does not show export button when no entries', () => {
        useConfigMcpStore.setState({ enabled: true });
        render(<AuditLog />);
        expect(screen.queryByText('mcp.audit-log.export')).not.toBeInTheDocument();
    });

    it('shows duration when available', () => {
        const entries: McpAuditEntry[] = [
            {
                timestamp: '2024-01-15T12:00:00Z',
                tool_name: 'test_tool',
                tier: 'read',
                status: 'Success',
                duration_ms: 150,
            },
        ];
        useConfigMcpStore.setState({ enabled: true });
        useMcpStore.setState({ auditEntries: entries });
        render(<AuditLog />);
        expect(screen.getByText('mcp.audit-log.duration-ms')).toBeInTheDocument();
    });

    it('renders multiple entries', () => {
        const entries: McpAuditEntry[] = [
            { timestamp: '2024-01-15T12:00:00Z', tool_name: 'tool_a', tier: 'read', status: 'Success' },
            { timestamp: '2024-01-15T12:01:00Z', tool_name: 'tool_b', tier: 'control', status: 'Error' },
            { timestamp: '2024-01-15T12:02:00Z', tool_name: 'tool_c', tier: 'transaction', status: 'Denied' },
        ];
        useConfigMcpStore.setState({ enabled: true });
        useMcpStore.setState({ auditEntries: entries });
        render(<AuditLog />);
        expect(screen.getByText('tool_a')).toBeInTheDocument();
        expect(screen.getByText('tool_b')).toBeInTheDocument();
        expect(screen.getByText('tool_c')).toBeInTheDocument();
    });
});
