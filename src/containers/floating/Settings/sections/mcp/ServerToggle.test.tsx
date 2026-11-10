/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { invoke } from '@tauri-apps/api/core';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useMcpStore } from '@app/store/useMcpStore';
import ServerToggle from './ServerToggle';
import AdvancedSettings from './AdvancedSettings';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

describe('ServerToggle', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        useConfigMcpStore.setState({ enabled: false, port: 4444 });
        useMcpStore.setState({ serverRunning: false, serverPort: null, portError: null });
    });

    it('renders title', () => {
        render(<ServerToggle />);
        expect(screen.getByText('mcp.server-toggle.title')).toBeInTheDocument();
    });

    it('renders description', () => {
        render(<ServerToggle />);
        expect(screen.getByText('mcp.server-toggle.description')).toBeInTheDocument();
    });

    it('shows stopped status when server is not running', () => {
        render(<ServerToggle />);
        expect(screen.getByText('mcp.server-toggle.status-stopped')).toBeInTheDocument();
    });

    it('shows running status when server is running', () => {
        useMcpStore.setState({ serverRunning: true, serverPort: 19222 });
        render(<ServerToggle />);
        expect(screen.getByText('mcp.server-toggle.status-running')).toBeInTheDocument();
    });

    it('renders toggle switch', () => {
        render(<ServerToggle />);
        expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('toggle reflects enabled state', () => {
        useConfigMcpStore.setState({ enabled: true });
        render(<ServerToggle />);
        expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('toggle reflects disabled state', () => {
        useConfigMcpStore.setState({ enabled: false });
        render(<ServerToggle />);
        expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('surfaces port-in-use error and keeps advanced port visible when enabling fails due to port conflict', async () => {
        vi.mocked(invoke).mockRejectedValueOnce('MCP server failed to bind to configured port 4444: Address already in use');
        render(
            <>
                <ServerToggle />
                <AdvancedSettings />
            </>
        );

        fireEvent.click(screen.getByTestId('mcp-server-toggle'));

        await waitFor(() => {
            expect(invoke).toHaveBeenCalledWith('set_mcp_enabled', { enabled: true });
        });
        expect(useConfigMcpStore.getState().enabled).toBe(true);
        expect(screen.getByTestId('mcp-server-status')).toHaveTextContent('mcp.server-toggle.status-stopped');
        expect(await screen.findByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-in-use');
    });
});
