/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { invoke } from '@tauri-apps/api/core';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useMcpStore } from '@app/store/useMcpStore';
import ServerToggle from './ServerToggle';

const invokeMock = vi.mocked(invoke);

describe('ServerToggle', () => {
    beforeEach(() => {
        invokeMock.mockReset();
        invokeMock.mockResolvedValue(undefined);
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

    it('shows the port-in-use message when enabling fails because the saved port is taken', async () => {
        invokeMock.mockRejectedValueOnce(
            'MCP server failed to bind to configured port 4444: Address already in use (os error 98)'
        );
        useConfigMcpStore.setState({ enabled: false, port: 4444 });
        render(<ServerToggle />);

        fireEvent.click(screen.getByRole('checkbox'));

        await waitFor(() => {
            expect(screen.getByTestId('mcp-server-port-error')).toHaveTextContent('mcp.advanced.port-in-use');
        });
        expect(useMcpStore.getState().portError).toEqual({ kind: 'in-use', port: 4444 });
    });

    it('clears a previous port error when the server starts successfully', async () => {
        useMcpStore.setState({ portError: { kind: 'in-use', port: 4444 } });
        render(<ServerToggle />);
        expect(screen.getByTestId('mcp-server-port-error')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('checkbox'));

        await waitFor(() => {
            expect(screen.queryByTestId('mcp-server-port-error')).not.toBeInTheDocument();
        });
        expect(useMcpStore.getState().portError).toBeNull();
    });
});
