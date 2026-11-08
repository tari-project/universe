/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useMcpStore } from '@app/store/useMcpStore';
import { invoke } from '@tauri-apps/api/core';
import ServerToggle from './ServerToggle';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

describe('ServerToggle', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        useConfigMcpStore.setState({ enabled: false, port: 19222 });
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

    it('shows the bind failure when enabling on an occupied port', async () => {
        vi.mocked(invoke).mockRejectedValueOnce(
            'MCP server failed to bind to configured port 19222: Address already in use'
        );
        render(<ServerToggle />);
        fireEvent.click(screen.getByRole('checkbox'));
        expect(await screen.findByTestId('mcp-server-error')).toHaveTextContent('mcp.advanced.port-in-use');
    });

    it('clears a previous bind failure on the next attempt', async () => {
        vi.mocked(invoke).mockRejectedValueOnce('MCP server failed to bind to configured port 19222');
        render(<ServerToggle />);
        const toggle = screen.getByRole('checkbox');
        fireEvent.click(toggle);
        await screen.findByTestId('mcp-server-error');
        vi.mocked(invoke).mockResolvedValueOnce(undefined);
        fireEvent.click(toggle);
        await waitFor(() => expect(screen.queryByTestId('mcp-server-error')).not.toBeInTheDocument());
    });
});
