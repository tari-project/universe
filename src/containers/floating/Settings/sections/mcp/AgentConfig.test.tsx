/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@app/test/test-utils';
import { invoke } from '@tauri-apps/api/core';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useMcpStore } from '@app/store/useMcpStore';
import { useWalletStore } from '@app/store/useWalletStore';
import { useToastStore } from '@app/components/ToastStack/useToastStore';
import AgentConfig from './AgentConfig';

const invokeMock = vi.mocked(invoke) as unknown as Mock<(command: string) => Promise<unknown>>;

const writeText = vi.fn();
const readText = vi.fn();
const clear = vi.fn();

vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({
    writeText: (...args: unknown[]) => writeText(...args),
    readText: (...args: unknown[]) => readText(...args),
    clear: (...args: unknown[]) => clear(...args),
}));

describe('AgentConfig copy', () => {
    beforeEach(() => {
        writeText.mockReset().mockResolvedValue(undefined);
        readText.mockReset();
        clear.mockReset().mockResolvedValue(undefined);
        useToastStore.setState({ toasts: [] });
        useConfigMcpStore.setState({
            enabled: true,
            bearer_token_redacted: 'tu_••••••••',
        });
        useMcpStore.setState({ serverRunning: true, serverPort: 8080 });
        useWalletStore.setState({ is_pin_locked: false });
        invokeMock.mockReset();
        invokeMock.mockResolvedValue('tu_full_token');
    });

    it('copies the agent snippet through the shared clipboard path', async () => {
        render(<AgentConfig />);
        fireEvent.click(screen.getByText('mcp.agent-config.copy'));

        await waitFor(() => expect(writeText).toHaveBeenCalled());
        const written = String(writeText.mock.calls[0][0]);
        expect(written).toContain('tu_full_token');
        expect(written).toContain('http://127.0.0.1:8080/mcp');
        await waitFor(() => expect(screen.getByText('mcp.agent-config.copied')).toBeInTheDocument());
    });

    it('shows manual-copy guidance instead of a raw error when the copy fails', async () => {
        writeText.mockRejectedValue(new Error('X11 server connection timed out because it was unreachable'));
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        render(<AgentConfig />);
        fireEvent.click(screen.getByText('mcp.agent-config.copy'));

        await waitFor(() => expect(useToastStore.getState().toasts.length).toBe(1));
        const toast = useToastStore.getState().toasts[0];
        expect(toast.title).toBe('Failed to copy to clipboard');
        expect(toast.text).toContain('copy it manually');
        expect(screen.getByText('mcp.agent-config.copy')).toBeInTheDocument();
        consoleError.mockRestore();
    });
});
