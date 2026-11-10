/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { invoke } from '@tauri-apps/api/core';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useMcpStore } from '@app/store/useMcpStore';
import ServerToggle from './ServerToggle';

describe('ServerToggle', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        vi.mocked(invoke).mockResolvedValue(undefined);
        useConfigMcpStore.setState({ enabled: false, port: 19222 });
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

    it('records port-in-use error and keeps Stopped status when enabling fails on a taken port', async () => {
        useConfigMcpStore.setState({ enabled: false, port: 4444 });
        vi.mocked(invoke).mockRejectedValueOnce(
            'MCP server failed to bind to configured port 4444: Address already in use'
        );

        render(<ServerToggle />);
        fireEvent.click(screen.getByTestId('mcp-server-toggle'));

        await waitFor(() => expect(useMcpStore.getState().portError).toEqual({ kind: 'in-use', port: 4444 }));
        expect(useConfigMcpStore.getState().enabled).toBe(true);
        expect(screen.getByText('mcp.server-toggle.status-stopped')).toBeInTheDocument();
    });

    it('shows a start-failed alert and leaves the toggle off on non-bind errors', async () => {
        useConfigMcpStore.setState({ enabled: false, port: 19222 });
        vi.mocked(invoke).mockRejectedValueOnce('Failed to save config');

        render(<ServerToggle />);
        fireEvent.click(screen.getByTestId('mcp-server-toggle'));

        const alert = await screen.findByTestId('mcp-server-toggle-error');
        expect(alert).toHaveTextContent('mcp.server-toggle.start-failed');
        expect(useConfigMcpStore.getState().enabled).toBe(false);
        expect(useMcpStore.getState().portError).toBeNull();
    });
});
