/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useMcpStore } from '@app/store/useMcpStore';
import { useWalletStore } from '@app/store/useWalletStore';
import { requestPin } from '@app/store/useSecurityStore';
import AgentConfig from './AgentConfig';

vi.mock('@app/store/useSecurityStore', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/store/useSecurityStore')>()),
    requestPin: vi.fn(),
}));
vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({ writeText: vi.fn() }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

describe('AgentConfig PIN state handling (#3518)', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        vi.mocked(invoke).mockImplementation((async (cmd: string) =>
            cmd === 'get_mcp_token' ? 'full-token-xyz' : undefined) as typeof invoke);
        vi.mocked(requestPin).mockReset();
        vi.mocked(requestPin).mockResolvedValue('1234');
        vi.mocked(writeText).mockReset();
        vi.mocked(writeText).mockResolvedValue(undefined as never);
        useConfigMcpStore.setState({ enabled: true, bearer_token_redacted: 'tu_••••••••' });
        useMcpStore.setState({ serverRunning: true, serverPort: 4321 });
    });

    it('asks for a PIN before copying the token while the PIN state is unknown', async () => {
        useWalletStore.setState({ is_pin_locked: undefined });
        render(<AgentConfig />);

        fireEvent.click(screen.getByText('mcp.agent-config.copy'));

        await waitFor(() => expect(writeText).toHaveBeenCalled());
        expect(requestPin).toHaveBeenCalledOnce();
        expect(invoke).toHaveBeenCalledWith('get_mcp_token', { pin: '1234' });
        expect(vi.mocked(writeText).mock.calls[0][0]).toContain('full-token-xyz');
    });

    it('copies the token without a PIN prompt when the wallet is known to have no PIN', async () => {
        useWalletStore.setState({ is_pin_locked: false });
        render(<AgentConfig />);

        fireEvent.click(screen.getByText('mcp.agent-config.copy'));

        await waitFor(() => expect(writeText).toHaveBeenCalled());
        expect(requestPin).not.toHaveBeenCalled();
        expect(invoke).toHaveBeenCalledWith('get_mcp_token');
    });
});
