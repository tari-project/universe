/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen } from '@app/test/test-utils';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useMcpStore } from '@app/store/useMcpStore';
import ServerToggle from './ServerToggle';

describe('ServerToggle', () => {
    beforeEach(() => {
        useConfigMcpStore.setState({ enabled: false, port: 4444 });
        vi.mocked(invoke).mockReset();
        useMcpStore.setState({ serverRunning: false, serverPort: null });
    });

    it('explains an occupied saved port when enabling the server', async () => {
        vi.mocked(invoke).mockRejectedValueOnce('Address already in use (os error 98)');
        render(<ServerToggle />);
        fireEvent.click(screen.getByRole('checkbox'));
        expect(await screen.findByRole('alert')).toHaveTextContent('mcp.advanced.port-in-use');
        expect(vi.mocked(invoke)).toHaveBeenCalledWith('set_mcp_enabled', { enabled: true });
        expect(screen.getByText('mcp.server-toggle.status-stopped')).toBeInTheDocument();
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
});
