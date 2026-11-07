/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@app/test/test-utils';
import { invoke } from '@tauri-apps/api/core';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useMcpStore } from '@app/store/useMcpStore';
import ServerToggle from './ServerToggle';

const mockInvoke = vi.mocked(invoke);

describe('ServerToggle', () => {
    beforeEach(() => {
        useConfigMcpStore.setState({ enabled: false });
        useMcpStore.setState({ serverRunning: false, serverPort: null });
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

    it('shows a port-in-use error when enabling fails because the saved port is taken', async () => {
        mockInvoke.mockReset();
        mockInvoke.mockRejectedValueOnce(
            'MCP server failed to bind to configured port 19222: Address already in use (os error 98). ' +
                'Refusing to fall back to a random port for security reasons'
        );
        useConfigMcpStore.setState({ enabled: false, port: 19222 });
        render(<ServerToggle />);
        fireEvent.click(screen.getByRole('checkbox'));
        const error = await screen.findByTestId('mcp-server-error');
        expect(error).toHaveTextContent('mcp.server-toggle.port-in-use');
        expect(error).toHaveAttribute('role', 'alert');
        expect(screen.getByTestId('mcp-server-status')).toHaveTextContent('mcp.server-toggle.status-stopped');
    });
});
