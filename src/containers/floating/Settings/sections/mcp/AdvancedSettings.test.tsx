/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useMcpStore } from '@app/store/useMcpStore';
import AdvancedSettings from './AdvancedSettings';
import ServerToggle from './ServerToggle';

describe('AdvancedSettings', () => {
    beforeEach(() => {
        useConfigMcpStore.setState({
            enabled: false,
            read_tier_enabled: true,
            control_tier_enabled: true,
            port: 19222,
        });
        useMcpStore.setState({ serverRunning: false, serverPort: null, portInUse: null });
        vi.mocked(invoke).mockReset();
        vi.mocked(invoke).mockResolvedValue(undefined);
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

    it('shows the occupied port, keeps it configured, and reports the server stopped', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        useMcpStore.setState({ serverRunning: true, serverPort: 19222, portInUse: null });
        vi.mocked(invoke).mockRejectedValue('MCP_PORT_IN_USE:4444');
        render(
            <>
                <ServerToggle />
                <AdvancedSettings />
            </>
        );

        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '4444' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        const error = await screen.findByTestId('mcp-port-error');
        expect(error).toHaveTextContent('mcp.advanced.port-in-use');
        expect(error).toHaveAttribute('data-port', '4444');
        expect(screen.getByTestId('mcp-port-in-use')).toHaveAttribute('data-port', '4444');
        expect(input).toHaveValue('4444');
        expect(useConfigMcpStore.getState().port).toBe(4444);
        expect(screen.getByTestId('mcp-server-status')).toHaveTextContent('mcp.server-toggle.status-stopped');
        expect(useMcpStore.getState().serverRunning).toBe(false);
        expect(invoke).toHaveBeenCalledWith('set_mcp_port', { port: 4444 });
    });

    it('shows the same message when enabling fails because the saved port is taken', async () => {
        useConfigMcpStore.setState({ enabled: false, port: 4444 });
        vi.mocked(invoke).mockRejectedValue('MCP_PORT_IN_USE:4444');
        render(
            <>
                <ServerToggle />
                <AdvancedSettings />
            </>
        );

        fireEvent.click(screen.getByTestId('mcp-server-toggle'));

        const error = await screen.findByTestId('mcp-port-error');
        expect(error).toHaveTextContent('mcp.advanced.port-in-use');
        expect(error).toHaveAttribute('data-port', '4444');
        expect(screen.getByTestId('mcp-port-in-use')).toHaveTextContent('mcp.advanced.port-in-use');
        expect(screen.getByTestId('mcp-port-input')).toHaveValue('4444');
        expect(screen.getByTestId('mcp-server-status')).toHaveTextContent('mcp.server-toggle.status-stopped');
        expect(useConfigMcpStore.getState().enabled).toBe(true);
        expect(screen.getByTestId('mcp-server-toggle')).toBeChecked();
    });

    it('shows inline feedback for an out-of-range port and does not reset it', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '193334444' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(await screen.findByText('mcp.advanced.port-invalid')).toBeInTheDocument();
        expect(input).toHaveValue('193334444');
        expect(useConfigMcpStore.getState().port).toBe(19222);
        expect(invoke).not.toHaveBeenCalled();
    });

    it('shows inline feedback for a non-numeric port and does not reset it', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: 'abc' } });
        fireEvent.blur(input);

        expect(await screen.findByText('mcp.advanced.port-invalid')).toBeInTheDocument();
        expect(input).toHaveValue('abc');
        expect(invoke).not.toHaveBeenCalled();
    });

    it('rejects a port below 1024', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '1023' } });
        fireEvent.blur(input);

        expect(await screen.findByText('mcp.advanced.port-invalid')).toBeInTheDocument();
        expect(input).toHaveValue('1023');
        expect(invoke).not.toHaveBeenCalled();
    });

    it('keeps the previous port when the change is rejected before it is saved', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        vi.mocked(invoke).mockRejectedValue('disk full');
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '4444' } });
        fireEvent.blur(input);

        await waitFor(() => expect(invoke).toHaveBeenCalledWith('set_mcp_port', { port: 4444 }));
        expect(input).toHaveValue('19222');
        expect(useConfigMcpStore.getState().port).toBe(19222);
        expect(screen.queryByTestId('mcp-port-error')).not.toBeInTheDocument();
    });

    it('clears the in-use error after a later port is accepted', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        useMcpStore.setState({ serverRunning: true, serverPort: 19222, portInUse: null });
        vi.mocked(invoke).mockRejectedValueOnce('MCP_PORT_IN_USE:4444');
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '4444' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(await screen.findByTestId('mcp-port-error')).toBeInTheDocument();

        vi.mocked(invoke).mockResolvedValueOnce(undefined);
        fireEvent.change(input, { target: { value: '19223' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        await waitFor(() => expect(useConfigMcpStore.getState().port).toBe(19223));
        expect(screen.queryByTestId('mcp-port-error')).not.toBeInTheDocument();
        expect(input).toHaveValue('19223');
    });

    it('retries a blocked port when Enter is pressed again', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        useMcpStore.setState({ serverRunning: true, serverPort: 19222, portInUse: null });
        vi.mocked(invoke).mockRejectedValueOnce('MCP_PORT_IN_USE:4444');
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '4444' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(await screen.findByTestId('mcp-port-error')).toBeInTheDocument();

        vi.mocked(invoke).mockResolvedValueOnce(undefined);
        fireEvent.keyDown(input, { key: 'Enter' });
        await waitFor(() => expect(invoke).toHaveBeenCalledTimes(2));
        expect(invoke).toHaveBeenLastCalledWith('set_mcp_port', { port: 4444 });
    });
});
