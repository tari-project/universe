/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { invoke } from '@tauri-apps/api/core';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useWalletStore } from '@app/store/useWalletStore';
import { requestPin } from '@app/store/useSecurityStore';
import TokenDisplay from './TokenDisplay';

vi.mock('@app/store/useSecurityStore', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/store/useSecurityStore')>()),
    requestPin: vi.fn(),
}));

describe('TokenDisplay', () => {
    beforeEach(() => {
        useConfigMcpStore.setState({
            enabled: false,
            bearer_token_redacted: undefined,
            token_created_at: undefined,
            token_expires_at: undefined,
        });
    });

    it('returns null when MCP is disabled', () => {
        const { container } = render(<TokenDisplay />);
        expect(container.firstChild).toBeNull();
    });

    it('returns null when no token exists', () => {
        useConfigMcpStore.setState({ enabled: true, bearer_token_redacted: undefined });
        const { container } = render(<TokenDisplay />);
        expect(container.firstChild).toBeNull();
    });

    it('renders when enabled and token exists', () => {
        useConfigMcpStore.setState({ enabled: true, bearer_token_redacted: 'tu_••••••••' });
        render(<TokenDisplay />);
        expect(screen.getByText('mcp.token-display.title')).toBeInTheDocument();
    });

    it('shows redacted token by default', () => {
        useConfigMcpStore.setState({ enabled: true, bearer_token_redacted: 'tu_••••••••' });
        render(<TokenDisplay />);
        expect(screen.getByText('tu_••••••••')).toBeInTheDocument();
    });

    it('renders reveal button', () => {
        useConfigMcpStore.setState({ enabled: true, bearer_token_redacted: 'tu_••••••••' });
        render(<TokenDisplay />);
        expect(screen.getByText('mcp.token-display.reveal')).toBeInTheDocument();
    });

    it('renders copy button', () => {
        useConfigMcpStore.setState({ enabled: true, bearer_token_redacted: 'tu_••••••••' });
        render(<TokenDisplay />);
        expect(screen.getByText('mcp.token-display.copy')).toBeInTheDocument();
    });

    it('renders refresh expiry button', () => {
        useConfigMcpStore.setState({ enabled: true, bearer_token_redacted: 'tu_••••••••' });
        render(<TokenDisplay />);
        expect(screen.getByText('mcp.token-display.refresh-expiry')).toBeInTheDocument();
    });

    it('renders revoke button', () => {
        useConfigMcpStore.setState({ enabled: true, bearer_token_redacted: 'tu_••••••••' });
        render(<TokenDisplay />);
        expect(screen.getByText('mcp.token-display.revoke')).toBeInTheDocument();
    });

    it('shows created date when available', () => {
        useConfigMcpStore.setState({
            enabled: true,
            bearer_token_redacted: 'tu_••••••••',
            token_created_at: { secs_since_epoch: Math.floor(Date.now() / 1000), nanos_since_epoch: 0 },
        });
        render(<TokenDisplay />);
        expect(screen.getByText(/mcp\.token-display\.created/)).toBeInTheDocument();
    });

    it('shows days remaining when expiry is set', () => {
        const futureEpoch = Math.floor(Date.now() / 1000) + 86400 * 30;
        useConfigMcpStore.setState({
            enabled: true,
            bearer_token_redacted: 'tu_••••••••',
            token_created_at: { secs_since_epoch: Math.floor(Date.now() / 1000), nanos_since_epoch: 0 },
            token_expires_at: { secs_since_epoch: futureEpoch, nanos_since_epoch: 0 },
        });
        render(<TokenDisplay />);
        expect(screen.getByText(/mcp\.token-display\.days-remaining/)).toBeInTheDocument();
    });

    describe('PIN state handling (#3518)', () => {
        beforeEach(() => {
            vi.mocked(invoke).mockReset();
            vi.mocked(invoke).mockImplementation((async (cmd: string) =>
                cmd === 'get_mcp_token' ? 'full-token-xyz' : undefined) as typeof invoke);
            vi.mocked(requestPin).mockReset();
            vi.mocked(requestPin).mockResolvedValue('1234');
            useConfigMcpStore.setState({ enabled: true, bearer_token_redacted: 'tu_••••••••' });
        });

        it('asks for a PIN before revealing while the PIN state is unknown', async () => {
            useWalletStore.setState({ is_pin_locked: undefined });
            render(<TokenDisplay />);

            fireEvent.click(screen.getByTestId('mcp-token-reveal'));

            await waitFor(() => expect(screen.getByText('full-token-xyz')).toBeInTheDocument());
            expect(requestPin).toHaveBeenCalledOnce();
            expect(invoke).toHaveBeenCalledWith('get_mcp_token', { pin: '1234' });
        });

        it('reveals without a PIN prompt when the wallet is known to have no PIN', async () => {
            useWalletStore.setState({ is_pin_locked: false });
            render(<TokenDisplay />);

            fireEvent.click(screen.getByTestId('mcp-token-reveal'));

            await waitFor(() => expect(screen.getByText('full-token-xyz')).toBeInTheDocument());
            expect(requestPin).not.toHaveBeenCalled();
            expect(invoke).toHaveBeenCalledWith('get_mcp_token', { pin: null });
        });
    });
});
