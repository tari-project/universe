/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@app/test/test-utils';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useMcpStore } from '@app/store/useMcpStore';
import AdvancedSettings from './AdvancedSettings';

vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';

describe('AdvancedSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useConfigMcpStore.setState({
            enabled: false,
            port: 19222,
            read_tier_enabled: true,
            control_tier_enabled: true,
        });
        useMcpStore.setState({
            serverRunning: false,
            serverPort: null,
            portError: null,
        });
    });

    it('returns null when MCP is disabled', () => {
        const { container } = render(<AdvancedSettings />);
        expect(container.firstChild).toBeNull();
    });

    it('renders when MCP is enabled', () => {
        useConfigMcpStore.setState({ enabled: true });
        render(<AdvancedSettings />);
        expect(screen.getByText('mcp.advanced.read-tier')).toBeInTheDocument();
        expect(screen.getByText('mcp.advanced.control-tier')).toBeInTheDocument();
        expect(screen.getByText('mcp.advanced.port')).toBeInTheDocument();
    });

    it('renders two toggle switches', () => {
        useConfigMcpStore.setState({ enabled: true });
        render(<AdvancedSettings />);
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes).toHaveLength(2);
    });

    it('read tier toggle reflects state', () => {
        useConfigMcpStore.setState({ enabled: true, read_tier_enabled: true });
        render(<AdvancedSettings />);
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes[0]).toBeChecked();
    });

    it('control tier toggle reflects state', () => {
        useConfigMcpStore.setState({ enabled: true, control_tier_enabled: false });
        render(<AdvancedSettings />);
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes[1]).not.toBeChecked();
    });

    it('renders port input with current configured port', () => {
        useConfigMcpStore.setState({ enabled: true, port: 8080 });
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        expect(input).toHaveValue(8080);
    });

    it('shows inline feedback when out-of-range port is entered', () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');

        fireEvent.change(input, { target: { value: '80' } });
        fireEvent.blur(input);

        expect(screen.getByTestId('mcp-port-error')).toBeInTheDocument();
        expect(screen.getByText('mcp.advanced.port-invalid-range')).toBeInTheDocument();
    });

    it('shows inline feedback when huge invalid port is entered', () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');

        fireEvent.change(input, { target: { value: '193334444' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(screen.getByTestId('mcp-port-error')).toBeInTheDocument();
        expect(screen.getByText('mcp.advanced.port-invalid-range')).toBeInTheDocument();
    });

    it('shows port-in-use error message when set_mcp_port fails due to bind conflict', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        vi.mocked(invoke).mockRejectedValueOnce(
            'MCP server failed to bind to configured port 4444: Address already in use'
        );

        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');

        fireEvent.change(input, { target: { value: '4444' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        await waitFor(() => {
            expect(screen.getByTestId('mcp-port-error')).toBeInTheDocument();
            expect(screen.getByText('mcp.advanced.port-in-use')).toBeInTheDocument();
        });
    });

    it('clears error feedback when user changes the port input', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');

        fireEvent.change(input, { target: { value: '80' } });
        fireEvent.blur(input);
        expect(screen.getByTestId('mcp-port-error')).toBeInTheDocument();

        fireEvent.change(input, { target: { value: '19222' } });
        expect(screen.queryByTestId('mcp-port-error')).toBeNull();
    });

    it('displays portError from useMcpStore when server enable failed', () => {
        useConfigMcpStore.setState({ enabled: true, port: 4444 });
        useMcpStore.setState({ portError: 'Port 4444 is already in use. Choose another port.' });

        render(<AdvancedSettings />);
        expect(screen.getByTestId('mcp-port-error')).toBeInTheDocument();
        expect(screen.getByText('Port 4444 is already in use. Choose another port.')).toBeInTheDocument();
    });
});
