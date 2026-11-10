/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { invoke } from '@tauri-apps/api/core';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useMcpStore } from '@app/store/useMcpStore';
import AdvancedSettings from './AdvancedSettings';
import ServerToggle from './ServerToggle';

describe('AdvancedSettings', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        vi.mocked(invoke).mockResolvedValue(undefined);
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

    it('shows port-in-use error and keeps the configured port when set_mcp_port fails to bind', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        useMcpStore.setState({ serverRunning: true, serverPort: 19222 });
        vi.mocked(invoke).mockRejectedValueOnce(
            'MCP server failed to bind to configured port 4444: Address already in use (os error 48)'
        );

        render(<AdvancedSettings />);
        const portInput = screen.getByTestId('mcp-port-input');
        fireEvent.change(portInput, { target: { value: '4444' } });
        fireEvent.blur(portInput);

        const alert = await screen.findByTestId('mcp-port-error');
        expect(alert).toHaveTextContent('mcp.advanced.port-in-use');
        expect(portInput).toHaveValue(4444);
        expect(useConfigMcpStore.getState().port).toBe(4444);
        expect(useMcpStore.getState().serverRunning).toBe(false);
        expect(useMcpStore.getState().portError).toEqual({ kind: 'in-use', port: 4444 });
    });

    it('shows the same port-in-use error when enabling the server fails on a taken port', async () => {
        useConfigMcpStore.setState({ enabled: false, port: 4444 });
        vi.mocked(invoke).mockRejectedValueOnce(
            'MCP server failed to bind to configured port 4444: Address already in use (os error 48)'
        );

        render(
            <>
                <ServerToggle />
                <AdvancedSettings />
            </>
        );
        fireEvent.click(screen.getByTestId('mcp-server-toggle'));

        const alert = await screen.findByTestId('mcp-port-error');
        expect(alert).toHaveTextContent('mcp.advanced.port-in-use');
        expect(screen.getByTestId('mcp-server-status')).toHaveTextContent('mcp.server-toggle.status-stopped');
        expect(screen.getByTestId('mcp-port-input')).toHaveValue(4444);
    });

    it.each([
        ['0', 'mcp.advanced.port-out-of-range'],
        ['80', 'mcp.advanced.port-out-of-range'],
        ['1023', 'mcp.advanced.port-out-of-range'],
        ['65536', 'mcp.advanced.port-out-of-range'],
        ['193334444', 'mcp.advanced.port-out-of-range'],
        ['', 'mcp.advanced.port-invalid'],
        ['abc', 'mcp.advanced.port-invalid'],
        ['4e3', 'mcp.advanced.port-invalid'],
        ['4444.5', 'mcp.advanced.port-invalid'],
    ])(
        'shows inline validation error for %j (%s) without calling set_mcp_port',
        async (rawInput, expectedErrorKey) => {
            useConfigMcpStore.setState({ enabled: true, port: 19222 });
            render(<AdvancedSettings />);

            const portInput = screen.getByTestId('mcp-port-input') as HTMLInputElement;
            fireEvent.change(portInput, { target: { value: rawInput } });
            fireEvent.blur(portInput);

            const alert = await screen.findByTestId('mcp-port-error');
            expect(alert).toHaveTextContent(expectedErrorKey);
            expect(invoke).not.toHaveBeenCalledWith('set_mcp_port', expect.anything());
        }
    );

    it.each([1024, 65535])('accepts valid boundary port %i', async (boundaryPort) => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        render(<AdvancedSettings />);

        const portInput = screen.getByTestId('mcp-port-input');
        fireEvent.change(portInput, { target: { value: String(boundaryPort) } });
        fireEvent.keyDown(portInput, { key: 'Enter' });

        await waitFor(() => expect(invoke).toHaveBeenCalledWith('set_mcp_port', { port: boundaryPort }));
        expect(screen.queryByTestId('mcp-port-error')).not.toBeInTheDocument();
        expect(useConfigMcpStore.getState().port).toBe(boundaryPort);
    });

    it('clears the port error when a valid free port is committed', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 4444 });
        useMcpStore.setState({
            serverRunning: false,
            serverPort: null,
            portError: { kind: 'in-use', port: 4444 },
        });

        render(<AdvancedSettings />);
        expect(screen.getByTestId('mcp-port-error')).toBeInTheDocument();

        const portInput = screen.getByTestId('mcp-port-input');
        fireEvent.change(portInput, { target: { value: '19223' } });
        fireEvent.keyDown(portInput, { key: 'Enter' });

        await waitFor(() => expect(invoke).toHaveBeenCalledWith('set_mcp_port', { port: 19223 }));
        expect(screen.queryByTestId('mcp-port-error')).not.toBeInTheDocument();
        expect(useConfigMcpStore.getState().port).toBe(19223);
    });

    it('allows retrying the same port on Enter when the server is stopped after a port conflict', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 4444 });
        useMcpStore.setState({
            serverRunning: false,
            serverPort: null,
            portError: { kind: 'in-use', port: 4444 },
        });

        render(<AdvancedSettings />);
        const portInput = screen.getByTestId('mcp-port-input');
        fireEvent.keyDown(portInput, { key: 'Enter' });

        await waitFor(() => expect(invoke).toHaveBeenCalledWith('set_mcp_port', { port: 4444 }));
        expect(screen.queryByTestId('mcp-port-error')).not.toBeInTheDocument();
    });
});
