/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@app/test/test-utils';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import TransactionSettings from './TransactionSettings';

describe('TransactionSettings', () => {
    beforeEach(() => {
        useConfigMcpStore.setState({ enabled: false, transactions_enabled: false });
    });

    it('returns null when MCP is disabled', () => {
        const { container } = render(<TransactionSettings />);
        expect(container.firstChild).toBeNull();
    });

    it('renders when MCP is enabled', () => {
        useConfigMcpStore.setState({ enabled: true });
        render(<TransactionSettings />);
        expect(screen.getByText('mcp.transactions.title')).toBeInTheDocument();
    });

    it('renders description text', () => {
        useConfigMcpStore.setState({ enabled: true });
        render(<TransactionSettings />);
        expect(screen.getByText('mcp.transactions.description')).toBeInTheDocument();
    });

    it('renders toggle switch', () => {
        useConfigMcpStore.setState({ enabled: true });
        render(<TransactionSettings />);
        expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('toggle reflects transactions_enabled state', () => {
        useConfigMcpStore.setState({ enabled: true, transactions_enabled: true });
        render(<TransactionSettings />);
        expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('toggle is unchecked when transactions disabled', () => {
        useConfigMcpStore.setState({ enabled: true, transactions_enabled: false });
        render(<TransactionSettings />);
        expect(screen.getByRole('checkbox')).not.toBeChecked();
    });
});
