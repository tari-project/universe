/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@app/test/test-utils';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useMcpStore } from '@app/store/useMcpStore';
import ServerToggle from './ServerToggle';

vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';

describe('ServerToggle', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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

    it('displays error message when server is stopped and port error exists', () => {
        useMcpStore.setState({
            serverRunning: false,
            portError: 'Port 4444 is already in use. Choose another port.',
        });
        render(<ServerToggle />);
        expect(screen.getByTestId('mcp-server-error')).toBeInTheDocument();
        expect(screen.getByText('Port 4444 is already in use. Choose another port.')).toBeInTheDocument();
    });

    it('does not display error message when server is running even if old error lingered', () => {
        useMcpStore.setState({
            serverRunning: true,
            serverPort: 19222,
            portError: 'Port 4444 is already in use.',
        });
        render(<ServerToggle />);
        expect(screen.queryByTestId('mcp-server-error')).toBeNull();
    });

    it('shows port in use error when toggle enable fails due to bind error', async () => {
        useConfigMcpStore.setState({ enabled: false, port: 4444 });
        vi.mocked(invoke).mockRejectedValueOnce('MCP server failed to bind to configured port 4444: os error 98');

        render(<ServerToggle />);
        const toggle = screen.getByTestId('mcp-server-toggle');

        fireEvent.click(toggle);

        await waitFor(() => {
            expect(screen.getByTestId('mcp-server-error')).toBeInTheDocument();
            expect(screen.getByText('mcp.server-toggle.port-in-use')).toBeInTheDocument();
        });
    });
});
