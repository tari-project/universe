/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@app/test/test-utils';
import { invoke } from '@tauri-apps/api/core';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useWalletStore } from '@app/store/useWalletStore';
import { useToastStore } from '@app/components/ToastStack/useToastStore';
import TokenDisplay from './TokenDisplay';

const invokeMock = vi.mocked(invoke) as unknown as Mock<(command: string) => Promise<unknown>>;

const writeText = vi.fn();
const readText = vi.fn();
const clear = vi.fn();

vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({
    writeText: (...args: unknown[]) => writeText(...args),
    readText: (...args: unknown[]) => readText(...args),
    clear: (...args: unknown[]) => clear(...args),
}));

describe('TokenDisplay', () => {
    beforeEach(() => {
        writeText.mockReset().mockResolvedValue(undefined);
        readText.mockReset();
        clear.mockReset().mockResolvedValue(undefined);
        useToastStore.setState({ toasts: [] });
        useWalletStore.setState({ is_pin_locked: false });
        invokeMock.mockReset();
        invokeMock.mockResolvedValue('tu_full_token');
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

    it('shows days remaining when expiry is set', async () => {
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

    it('copies the fetched token through the shared clipboard path', async () => {
        useConfigMcpStore.setState({ enabled: true, bearer_token_redacted: 'tu_••••••••' });
        render(<TokenDisplay />);
        fireEvent.click(screen.getByText('mcp.token-display.copy'));

        await waitFor(() => expect(writeText).toHaveBeenCalledWith('tu_full_token'));
        await waitFor(() => expect(screen.getByText('mcp.token-display.copied')).toBeInTheDocument());
    });

    it('shows manual-copy guidance instead of a raw error when the copy fails', async () => {
        writeText.mockRejectedValue(new Error('X11 server connection timed out because it was unreachable'));
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        useConfigMcpStore.setState({ enabled: true, bearer_token_redacted: 'tu_••••••••' });
        render(<TokenDisplay />);
        fireEvent.click(screen.getByText('mcp.token-display.copy'));

        await waitFor(() => expect(useToastStore.getState().toasts.length).toBe(1));
        const toast = useToastStore.getState().toasts[0];
        expect(toast.title).toBe('Failed to copy to clipboard');
        expect(toast.text).toContain('copy it manually');
        expect(screen.getByText('mcp.token-display.copy')).toBeInTheDocument();
        consoleError.mockRestore();
    });
});
