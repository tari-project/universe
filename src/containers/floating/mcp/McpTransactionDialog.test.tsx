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
            expect(screen.getByText('wallet:send.review-title')).toBeInTheDocument();
        });
    });

    it('shows review label', async () => {
        setMcpPendingTransaction({
            request_id: 'mcp_tx_123',
            destination: '5AexampleAddress',
            amount_micro_minotari: 1_500_000,
            amount_display: '1.5 XTM',
        });
        render(<McpTransactionDialog />);
        await waitFor(() => {
            expect(screen.getByText('send.review-label')).toBeInTheDocument();
        });
    });

    it('shows confirm button', async () => {
        setMcpPendingTransaction({
            request_id: 'mcp_tx_123',
            destination: '5AexampleAddress',
            amount_micro_minotari: 1_500_000,
            amount_display: '1.5 XTM',
        });
        render(<McpTransactionDialog />);
        await waitFor(() => {
            expect(screen.getByText('send.cta-confirm')).toBeInTheDocument();
        });
    });

    it('shows destination address label', async () => {
        setMcpPendingTransaction({
            request_id: 'mcp_tx_123',
            destination: '5AexampleAddress',
            amount_micro_minotari: 1_500_000,
            amount_display: '1.5 XTM',
        });
        render(<McpTransactionDialog />);
        await waitFor(() => {
            expect(screen.getByText('send.destination-address')).toBeInTheDocument();
        });
    });

    it('shows destination address value', async () => {
        setMcpPendingTransaction({
            request_id: 'mcp_tx_123',
            destination: '5AexampleAddress',
            amount_micro_minotari: 1_500_000,
            amount_display: '1.5 XTM',
        });
        render(<McpTransactionDialog />);
        await waitFor(() => {
            expect(screen.getByText('5AexampleAddress')).toBeInTheDocument();
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

    it('shows countdown timer text', async () => {
        setMcpPendingTransaction({
            request_id: 'mcp_tx_123',
            destination: '5AexampleAddress',
            amount_micro_minotari: 1_500_000,
            amount_display: '1.5 XTM',
        });
        render(<McpTransactionDialog />);
        await waitFor(() => {
            expect(screen.getByText('settings:mcp.transaction-dialog.remaining')).toBeInTheDocument();
        });
    });
});
