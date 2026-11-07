/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@app/test/test-utils';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useMcpStore } from '@app/store/useMcpStore';
import { invoke } from '@tauri-apps/api/core';
import AdvancedSettings from './AdvancedSettings';

vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(),
}));

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
            serverError: null,
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

    it('shows inline validation error when an out-of-range port is entered', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '193334444' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(await screen.findByTestId('mcp-port-error')).toHaveTextContent(
            'mcp.advanced.port-invalid'
        );
        expect(invoke).not.toHaveBeenCalled();
    });

    it('shows port-in-use error when set_mcp_port fails to bind', async () => {
        vi.mocked(invoke).mockRejectedValueOnce(
            'MCP server failed to bind to configured port 4444: Address already in use (os error 98)'
        );
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '4444' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        await waitFor(() => {
            expect(screen.getByTestId('mcp-port-error')).toHaveTextContent(
                'mcp.advanced.port-in-use'
            );
        });
    });
});
