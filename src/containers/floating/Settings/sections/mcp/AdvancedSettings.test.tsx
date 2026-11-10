/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@app/test/test-utils';
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
            portError: null,
            serverRunning: false,
            serverPort: null,
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

    it('shows port input with configured port', () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        expect(input).toHaveValue(19222);
    });

    it('shows inline error feedback when an out-of-range port is entered without resetting value', () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');

        fireEvent.change(input, { target: { value: '193334444' } });
        expect(screen.getByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-range-error');
        expect(input).toHaveValue(193334444);

        fireEvent.blur(input);
        expect(screen.getByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-range-error');
        expect(input).toHaveValue(193334444);
    });

    it('shows inline error feedback when port is below 1024', () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');

        fireEvent.change(input, { target: { value: '80' } });
        expect(screen.getByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-range-error');
    });

    it('shows translatable error message when port is already in use from store', () => {
        useConfigMcpStore.setState({ enabled: true, port: 4444 });
        useMcpStore.setState({ portError: 'Port 4444 is already in use. Choose another port.' });
        render(<AdvancedSettings />);
        expect(screen.getByTestId('mcp-port-error')).toHaveTextContent(
            'Port 4444 is already in use. Choose another port.'
        );
    });

    it('shows port in use error when set_mcp_port rejects and keeps configured port in store', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        const mockInvoke = vi.mocked(invoke);
        mockInvoke.mockRejectedValueOnce('Address already in use');

        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');

        fireEvent.change(input, { target: { value: '4444' } });
        fireEvent.blur(input);

        await waitFor(() => {
            expect(mockInvoke).toHaveBeenCalledWith('set_mcp_port', { port: 4444 });
            expect(screen.getByTestId('mcp-port-error')).toBeInTheDocument();
            expect(useConfigMcpStore.getState().port).toBe(4444);
        });
    });

    it('clears port error when user changes the input value', () => {
        useConfigMcpStore.setState({ enabled: true, port: 4444 });
        useMcpStore.setState({ portError: 'Port 4444 is already in use. Choose another port.' });

        render(<AdvancedSettings />);
        expect(screen.getByTestId('mcp-port-error')).toBeInTheDocument();

        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '4445' } });

        expect(screen.queryByTestId('mcp-port-error')).toBeNull();
    });
});
