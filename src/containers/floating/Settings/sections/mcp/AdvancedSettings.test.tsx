/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { invoke } from '@tauri-apps/api/core';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { setMcpServerStatus, useMcpStore } from '@app/store/useMcpStore';
import AdvancedSettings from './AdvancedSettings';
import ServerToggle from './ServerToggle';

describe('AdvancedSettings', () => {
    beforeEach(() => {
        useConfigMcpStore.setState({
            enabled: false,
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
});

describe('MCP settings failure and recovery', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        useConfigMcpStore.setState({ enabled: true, port: 19222 });
        useMcpStore.setState({ serverRunning: true, serverPort: 19222, settingsPending: false, settingsError: null });
    });

    afterEach(() => vi.restoreAllMocks());

    function enterPort(value: string) {
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value } });
        fireEvent.keyDown(input, { key: 'Enter' });
        return input;
    }

    it.each(['', 'abc', '1023', '65536', '193334444', '4444.5', '4e3', '0x1000', ' 4444 '])(
        'keeps invalid input %j visible and explains the allowed range without invoking the backend',
        (value) => {
            render(<AdvancedSettings />);
            const input = enterPort(value);
            expect(input).toHaveValue(value);
            expect(input).toHaveAttribute('aria-invalid', 'true');
            expect(input).toHaveAccessibleDescription('mcp.advanced.invalid-port');
            expect(screen.getByRole('alert')).toHaveTextContent('mcp.advanced.invalid-port');
            expect(invoke).not.toHaveBeenCalled();
        }
    );

    it.each([1024, 65535])('accepts valid boundary %i', async (port) => {
        vi.mocked(invoke).mockResolvedValue(undefined);
        render(<AdvancedSettings />);
        enterPort(String(port));
        await waitFor(() => expect(invoke).toHaveBeenCalledWith('set_mcp_port', { port }));
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('reports a conflict, preserves the persisted port and stopped status, then recovers on a free port', async () => {
        vi.mocked(invoke).mockImplementation(async (command, args) => {
            const port = Number((args as Record<string, unknown>).port);
            expect(command).toBe('set_mcp_port');
            // Model the real config/status events, followed by the IPC result.
            useConfigMcpStore.setState({ port });
            setMcpServerStatus(false, null);
            if (port === 4444) throw 'MCP server port 4444 is already in use: OS error. Choose another port.';
            setMcpServerStatus(true, port);
        });
        render(
            <>
                <ServerToggle />
                <AdvancedSettings />
            </>
        );
        enterPort('4444');
        expect(await screen.findByRole('alert')).toHaveTextContent('mcp.server-toggle.port-in-use');
        expect(useMcpStore.getState().settingsError).toEqual({ kind: 'port-in-use', port: 4444 });
        expect(screen.getByTestId('mcp-port-input')).toHaveValue('4444');
        expect(screen.getByTestId('mcp-server-status')).toHaveTextContent('mcp.server-toggle.status-stopped');
        enterPort('4445');
        await waitFor(() =>
            expect(screen.getByTestId('mcp-server-status')).toHaveTextContent('mcp.server-toggle.status-running')
        );
        expect(useMcpStore.getState().serverPort).toBe(4445);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('shows the same conflict on enable and lets the user correct the saved port without another toggle', async () => {
        useConfigMcpStore.setState({ enabled: false, port: 4444 });
        setMcpServerStatus(false, null);
        vi.mocked(invoke).mockImplementation(async () => {
            useConfigMcpStore.setState({ enabled: true });
            throw 'MCP server port 4444 is already in use: OS error. Choose another port.';
        });
        render(
            <>
                <ServerToggle />
                <AdvancedSettings />
            </>
        );
        fireEvent.click(screen.getByTestId('mcp-server-toggle'));
        expect(await screen.findByRole('alert')).toHaveTextContent('mcp.server-toggle.port-in-use');
        expect(invoke).toHaveBeenCalledWith('set_mcp_enabled', { enabled: true });
        expect(screen.getByTestId('mcp-port-input')).toHaveValue('4444');
        expect(screen.getByTestId('mcp-server-toggle')).toBeChecked();
        expect(screen.getByTestId('mcp-server-status')).toHaveTextContent('mcp.server-toggle.status-stopped');
    });

    it('does not describe a different bind failure as a port already in use', async () => {
        vi.mocked(invoke).mockRejectedValue('MCP server failed to bind to configured port 4444: Access denied');
        render(
            <>
                <ServerToggle />
                <AdvancedSettings />
            </>
        );
        enterPort('4444');
        expect(await screen.findByRole('alert')).toHaveTextContent('mcp.server-toggle.update-failed');
        expect(screen.queryByText('mcp.server-toggle.port-in-use')).not.toBeInTheDocument();
    });

    it('serializes Enter/blur and toggle actions while a listener change is pending', async () => {
        let finish!: () => void;
        vi.mocked(invoke).mockImplementation(
            () =>
                new Promise<void>((resolve) => {
                    finish = resolve;
                })
        );
        render(
            <>
                <ServerToggle />
                <AdvancedSettings />
            </>
        );
        const input = enterPort('4444');
        fireEvent.blur(input);
        fireEvent.click(screen.getByTestId('mcp-server-toggle'));
        expect(invoke).toHaveBeenCalledTimes(1);
        expect(input).toBeDisabled();
        expect(screen.getByTestId('mcp-server-toggle')).toBeDisabled();
        await act(async () => finish());
        expect(input).not.toBeDisabled();
        expect(screen.getByTestId('mcp-server-toggle')).not.toBeDisabled();
    });

    it('clears a shared conflict after disabling the server', async () => {
        useMcpStore.setState({ settingsError: { kind: 'port-in-use', port: 4444 } });
        vi.mocked(invoke).mockImplementation(async () => {
            useConfigMcpStore.setState({ enabled: false });
            setMcpServerStatus(false, null);
        });
        render(<ServerToggle />);
        fireEvent.click(screen.getByTestId('mcp-server-toggle'));
        await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
        expect(invoke).toHaveBeenCalledWith('set_mcp_enabled', { enabled: false });
    });
});
