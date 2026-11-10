/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { fireEvent, render, screen } from '@app/test/test-utils';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useMcpStore } from '@app/store/useMcpStore';
import ServerToggle from './ServerToggle';

describe('ServerToggle', () => {
    beforeEach(() => {
        useConfigMcpStore.setState({ enabled: false, port: 19222 });
        useMcpStore.setState({ serverRunning: false, serverPort: null, portInUse: null });
        vi.mocked(invoke).mockReset();
        vi.mocked(invoke).mockResolvedValue(undefined);
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

    it('shows that the saved port is in use when enabling fails, and leaves the server stopped', async () => {
        useConfigMcpStore.setState({ enabled: false, port: 4444 });
        vi.mocked(invoke).mockRejectedValue('MCP_PORT_IN_USE:4444');
        render(<ServerToggle />);

        fireEvent.click(screen.getByTestId('mcp-server-toggle'));

        const error = await screen.findByTestId('mcp-port-in-use');
        expect(error).toHaveTextContent('mcp.advanced.port-in-use');
        expect(error).toHaveAttribute('data-port', '4444');
        expect(screen.getByTestId('mcp-server-status')).toHaveTextContent('mcp.server-toggle.status-stopped');
        expect(useConfigMcpStore.getState().enabled).toBe(true);
        expect(useMcpStore.getState().serverRunning).toBe(false);
        expect(screen.getByTestId('mcp-server-toggle')).toBeChecked();
    });
});
