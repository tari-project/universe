/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/react';
import { invoke } from '@tauri-apps/api/core';
import { render, screen } from '@app/test/test-utils';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useMcpStore } from '@app/store/useMcpStore';
import ServerToggle from './ServerToggle';

describe('ServerToggle', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset().mockResolvedValue(undefined);
        useConfigMcpStore.setState({ enabled: false, port: 4444 });
        useMcpStore.setState({ serverRunning: false, serverPort: null, serverError: null });
    });

    it('shows saved-port conflicts when enabling and clears the error after retry', async () => {
        vi.mocked(invoke).mockImplementationOnce(async () => {
            useConfigMcpStore.setState({ enabled: true });
            throw 'MCP_PORT_IN_USE:4444: address already in use';
        });
        render(<ServerToggle />);
        fireEvent.click(screen.getByRole('checkbox'));
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('mcp.errors.port-in-use'));
        expect(useMcpStore.getState().serverError?.port).toBe(4444);
        expect(screen.getByRole('checkbox')).toBeChecked();
        expect(screen.getByTestId('mcp-server-status')).toHaveTextContent('mcp.server-toggle.status-stopped');
        fireEvent.click(screen.getByRole('checkbox'));
        await waitFor(() => expect(screen.getByRole('checkbox')).not.toBeDisabled());
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
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
