/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { invoke } from '@tauri-apps/api/core';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useMcpStore } from '@app/store/useMcpStore';
import AdvancedSettings from './AdvancedSettings';

const invokeMock = vi.mocked(invoke);

describe('AdvancedSettings', () => {
    beforeEach(() => {
        invokeMock.mockReset();
        invokeMock.mockResolvedValue(undefined);
        useConfigMcpStore.setState({
            enabled: false,
            read_tier_enabled: true,
            control_tier_enabled: true,
            port: 19222,
        });
        useMcpStore.setState({ serverRunning: false, serverPort: null, portError: null });
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

    it('shows the configured port in the input', () => {
        useConfigMcpStore.setState({ enabled: true, port: 19300 });
        render(<AdvancedSettings />);
        expect(screen.getByTestId('mcp-port-input')).toHaveValue(19300);
    });

    it('sends a valid port to the backend', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        render(<AdvancedSettings />);

        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '19300' } });
        fireEvent.blur(input);

        await waitFor(() => {
            expect(invokeMock).toHaveBeenCalledWith('set_mcp_port', { port: 19300 });
        });
        expect(screen.queryByTestId('mcp-port-error')).not.toBeInTheDocument();
    });

    it('rejects a non-numeric port inline without calling the backend', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        render(<AdvancedSettings />);

        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '19a' } });
        fireEvent.blur(input);

        await waitFor(() => {
            expect(screen.getByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-invalid');
        });
        expect(invokeMock).not.toHaveBeenCalled();
        // The invalid value stays visible instead of being silently reset.
        expect(input).toHaveValue(null);
        expect(useMcpStore.getState().portError?.kind).toBe('invalid');
    });

    it('rejects an out-of-range port inline without calling the backend', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        render(<AdvancedSettings />);

        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '193334444' } });
        fireEvent.blur(input);

        await waitFor(() => {
            expect(screen.getByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-out-of-range');
        });
        expect(invokeMock).not.toHaveBeenCalled();
        expect(useMcpStore.getState().portError).toEqual({ kind: 'out-of-range', value: '193334444' });
    });

    it('explains a bind failure and keeps the attempted port visible', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        invokeMock.mockRejectedValueOnce(
            'MCP server failed to bind to configured port 4444: Address already in use (os error 98)'
        );
        render(<AdvancedSettings />);

        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '4444' } });
        fireEvent.blur(input);

        await waitFor(() => {
            expect(screen.getByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-in-use');
        });
        expect(useMcpStore.getState().portError).toEqual({ kind: 'in-use', port: 4444 });
        expect(input).toHaveValue(4444);
    });

    it('reports an unexpected backend failure instead of swallowing it', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        invokeMock.mockRejectedValueOnce('disk is full');
        render(<AdvancedSettings />);

        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '19300' } });
        fireEvent.blur(input);

        await waitFor(() => {
            expect(screen.getByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-unknown-error');
        });
    });

    it('clears a previous error when a later port is accepted', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        useMcpStore.setState({ portError: { kind: 'in-use', port: 4444 } });
        render(<AdvancedSettings />);
        expect(screen.getByTestId('mcp-port-error')).toBeInTheDocument();

        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '19300' } });
        fireEvent.blur(input);

        await waitFor(() => {
            expect(screen.queryByTestId('mcp-port-error')).not.toBeInTheDocument();
        });
        expect(useMcpStore.getState().portError).toBeNull();
    });

    it('does not call the backend when the port is unchanged', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        render(<AdvancedSettings />);

        const input = screen.getByTestId('mcp-port-input');
        fireEvent.blur(input);

        await waitFor(() => {
            expect(screen.queryByTestId('mcp-port-error')).not.toBeInTheDocument();
        });
        expect(invokeMock).not.toHaveBeenCalled();
    });
});
