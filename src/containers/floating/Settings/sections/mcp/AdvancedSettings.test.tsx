/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@app/test/test-utils';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { invoke } from '@tauri-apps/api/core';
import AdvancedSettings from './AdvancedSettings';

vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(),
}));

describe('AdvancedSettings', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        useConfigMcpStore.setState({
            enabled: false,
            port: 4444,
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

    it('shows port range error for out-of-range input', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 4444 });
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '80' } });
        fireEvent.blur(input);
        await waitFor(() => {
            expect(screen.getByTestId('mcp-port-error')).toBeInTheDocument();
        });
        expect(screen.getByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-range');
    });

    it('shows bind error when port is in use', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 4444 });
        vi.mocked(invoke).mockRejectedValueOnce(
            'MCP server failed to bind to configured port 4444: Address already in use'
        );
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '9999' } });
        fireEvent.blur(input);
        await waitFor(() => {
            expect(screen.getByTestId('mcp-port-error')).toBeInTheDocument();
        });
        expect(screen.getByTestId('mcp-port-error')).toHaveTextContent('Address already in use');
    });

    it('clears error after successful port change', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 4444 });
        vi.mocked(invoke).mockResolvedValueOnce(undefined);
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '5555' } });
        fireEvent.blur(input);
        await waitFor(() => {
            expect(vi.mocked(invoke)).toHaveBeenCalledWith('set_mcp_port', { port: 5555 });
        });
        expect(screen.queryByTestId('mcp-port-error')).toBeNull();
    });
});
