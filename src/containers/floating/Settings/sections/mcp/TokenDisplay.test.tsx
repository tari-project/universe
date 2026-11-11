/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { useToastStore } from '@app/components/ToastStack/useToastStore';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useWalletStore } from '@app/store/useWalletStore';
import { requestPin } from '@app/store/useSecurityStore';
import TokenDisplay from './TokenDisplay';

vi.mock('@app/store/useSecurityStore', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/store/useSecurityStore')>()),
    requestPin: vi.fn(),
}));
// The shared clipboard module also imports readText and clear from the
// plugin, so the mock has to provide all three entry points.
vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({ writeText: vi.fn(), readText: vi.fn(), clear: vi.fn() }));

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

    describe('copy through the shared clipboard path (#3489)', () => {
        beforeEach(() => {
            vi.mocked(writeText).mockReset();
            vi.mocked(writeText).mockResolvedValue(undefined as never);
            useToastStore.setState({ toasts: [] });
            useWalletStore.setState({ is_pin_locked: false });
            vi.mocked(invoke).mockReset();
            vi.mocked(invoke).mockImplementation((async (cmd: string) =>
                cmd === 'get_mcp_token' ? 'tu_full_token' : undefined) as typeof invoke);
            useConfigMcpStore.setState({ enabled: true, bearer_token_redacted: 'tu_••••••••' });
        });

        it('copies the fetched token through the shared clipboard path', async () => {
            render(<TokenDisplay />);
            fireEvent.click(screen.getByText('mcp.token-display.copy'));

            await waitFor(() => expect(writeText).toHaveBeenCalledWith('tu_full_token'));
            await waitFor(() => expect(screen.getByText('mcp.token-display.copied')).toBeInTheDocument());
        });

        it('shows manual-copy guidance instead of a raw error when the copy fails', async () => {
            vi.mocked(writeText).mockRejectedValue(
                new Error('X11 server connection timed out because it was unreachable')
            );
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
            render(<TokenDisplay />);
            fireEvent.click(screen.getByText('mcp.token-display.copy'));

            await waitFor(() => expect(useToastStore.getState().toasts.length).toBe(1));
            const toast = useToastStore.getState().toasts[0];
            expect(toast.title).toBe('common:clipboard.copy-failed-title');
            expect(toast.text).toBe('common:clipboard.copy-failed-text');
            expect(screen.getByText('mcp.token-display.copy')).toBeInTheDocument();
            consoleError.mockRestore();
        });
    });
});
