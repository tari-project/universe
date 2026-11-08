/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { invoke } from '@tauri-apps/api/core';
import AdvancedSettings from './AdvancedSettings';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

describe('AdvancedSettings', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        useConfigMcpStore.setState({
            enabled: false,
            port: 19222,
            read_tier_enabled: true,
            control_tier_enabled: true,
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

    it('shows inline feedback for an out-of-range port instead of silently resetting it', async () => {
        useConfigMcpStore.setState({ enabled: true });
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '999' } });
        fireEvent.blur(input);
        expect(await screen.findByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-invalid');
        expect(input).toHaveValue(999);
        expect(vi.mocked(invoke)).not.toHaveBeenCalled();
    });

    it('shows a port-in-use message when the backend refuses to bind', async () => {
        useConfigMcpStore.setState({ enabled: true });
        vi.mocked(invoke).mockRejectedValueOnce(
            'MCP server failed to bind to configured port 4444: Address already in use'
        );
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '4444' } });
        fireEvent.blur(input);
        expect(await screen.findByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-in-use');
        expect(vi.mocked(invoke)).toHaveBeenCalledWith('set_mcp_port', { port: 4444 });
    });

    it('clears the port error when the value changes', async () => {
        useConfigMcpStore.setState({ enabled: true });
        vi.mocked(invoke).mockRejectedValueOnce(
            'MCP server failed to bind to configured port 4444: Address already in use'
        );
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '4444' } });
        fireEvent.blur(input);
        await screen.findByTestId('mcp-port-error');
        fireEvent.change(input, { target: { value: '4445' } });
        expect(screen.queryByTestId('mcp-port-error')).not.toBeInTheDocument();
    });

    it('commits a valid port', async () => {
        useConfigMcpStore.setState({ enabled: true });
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '19333' } });
        fireEvent.blur(input);
        await waitFor(() => expect(vi.mocked(invoke)).toHaveBeenCalledWith('set_mcp_port', { port: 19333 }));
    });
});
