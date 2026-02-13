/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@app/test/test-utils';
import { useMcpStore, setMcpPendingTransaction } from '@app/store/useMcpStore';
import McpTransactionDialog from './McpTransactionDialog';

describe('McpTransactionDialog', () => {
    beforeEach(() => {
        useMcpStore.setState({ pendingTransaction: null });
    });

    it('renders nothing when no pending transaction', () => {
        const { container } = render(<McpTransactionDialog />);
        expect(container.firstChild).toBeNull();
    });

    it('renders dialog when transaction is pending', async () => {
        setMcpPendingTransaction({
            request_id: 'mcp_tx_123',
            destination: '5AexampleAddressHere1234567890abcdef',
            amount_micro_minotari: 1_500_000,
            amount_display: '1.5 XTM',
        });
        render(<McpTransactionDialog />);
        await waitFor(() => {
            expect(screen.getByText('mcp.transaction-dialog.title')).toBeInTheDocument();
        });
    });

    it('shows amount display', async () => {
        setMcpPendingTransaction({
            request_id: 'mcp_tx_123',
            destination: '5AexampleAddress',
            amount_micro_minotari: 1_500_000,
            amount_display: '1.5 XTM',
        });
        render(<McpTransactionDialog />);
        await waitFor(() => {
            expect(screen.getByText('1.5 XTM')).toBeInTheDocument();
        });
    });

    it('shows PIN input', async () => {
        setMcpPendingTransaction({
            request_id: 'mcp_tx_123',
            destination: '5AexampleAddress',
            amount_micro_minotari: 1_500_000,
            amount_display: '1.5 XTM',
        });
        render(<McpTransactionDialog />);
        await waitFor(() => {
            expect(screen.getByPlaceholderText('PIN')).toBeInTheDocument();
        });
    });

    it('shows approve and deny buttons', async () => {
        setMcpPendingTransaction({
            request_id: 'mcp_tx_123',
            destination: '5AexampleAddress',
            amount_micro_minotari: 1_500_000,
            amount_display: '1.5 XTM',
        });
        render(<McpTransactionDialog />);
        await waitFor(() => {
            expect(screen.getByText('mcp.transaction-dialog.approve')).toBeInTheDocument();
            expect(screen.getByText('mcp.transaction-dialog.deny')).toBeInTheDocument();
        });
    });

    it('truncates long destination addresses', async () => {
        setMcpPendingTransaction({
            request_id: 'mcp_tx_123',
            destination: '5AexampleVeryLongAddressHere1234567890abcdef',
            amount_micro_minotari: 1_500_000,
            amount_display: '1.5 XTM',
        });
        render(<McpTransactionDialog />);
        await waitFor(() => {
            expect(screen.getByText('5AexampleV...7890abcdef')).toBeInTheDocument();
        });
    });

    it('shows short destination without truncation', async () => {
        setMcpPendingTransaction({
            request_id: 'mcp_tx_123',
            destination: 'shortAddr',
            amount_micro_minotari: 1_500_000,
            amount_display: '1.5 XTM',
        });
        render(<McpTransactionDialog />);
        await waitFor(() => {
            expect(screen.getByText('shortAddr')).toBeInTheDocument();
        });
    });

    it('shows micro minotari amount', async () => {
        setMcpPendingTransaction({
            request_id: 'mcp_tx_123',
            destination: '5AexampleAddress',
            amount_micro_minotari: 1_500_000,
            amount_display: '1.5 XTM',
        });
        render(<McpTransactionDialog />);
        await waitFor(() => {
            expect(screen.getByText('mcp.transaction-dialog.micro-minotari')).toBeInTheDocument();
        });
    });

    it('shows countdown timer', async () => {
        setMcpPendingTransaction({
            request_id: 'mcp_tx_123',
            destination: '5AexampleAddress',
            amount_micro_minotari: 1_500_000,
            amount_display: '1.5 XTM',
        });
        render(<McpTransactionDialog />);
        await waitFor(() => {
            expect(screen.getByText('mcp.transaction-dialog.remaining')).toBeInTheDocument();
        });
    });
});
