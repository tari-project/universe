/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useMcpStore } from '@app/store/useMcpStore';
import { invoke } from '@tauri-apps/api/core';
import AdvancedSettings from './AdvancedSettings';

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
            serverRunning: true,
            serverPort: 19222,
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

    it('shows inline range error and retains value when an out-of-range port is submitted', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input') as HTMLInputElement;

        fireEvent.change(input, { target: { value: '193334444' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(await screen.findByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-range-error');
        expect(input.value).toBe('193334444');
        expect(invoke).not.toHaveBeenCalledWith('set_mcp_port', expect.anything());
    });

    it('shows port-in-use error and keeps configured port visible when bind fails', async () => {
        vi.mocked(invoke).mockRejectedValueOnce(
            'MCP server failed to bind to configured port 4444: Address already in use (os error 98).'
        );
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input') as HTMLInputElement;

        fireEvent.change(input, { target: { value: '4444' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        await waitFor(() => {
            expect(invoke).toHaveBeenCalledWith('set_mcp_port', { port: 4444 });
        });
        expect(await screen.findByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-in-use');
        expect(input.value).toBe('4444');
        expect(useConfigMcpStore.getState().port).toBe(4444);
        expect(useMcpStore.getState().serverRunning).toBe(false);
    });
});
