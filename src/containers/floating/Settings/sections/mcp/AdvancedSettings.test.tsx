/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@app/test/test-utils';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import AdvancedSettings from './AdvancedSettings';
import ServerToggle from './ServerToggle';
import { invoke } from '@tauri-apps/api/core';
import { setMcpServerStatus, useMcpStore } from '@app/store/useMcpStore';

describe('AdvancedSettings', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        useMcpStore.setState({ serverRunning: false, serverPort: null, serverError: null });
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
    it.each(['', 'text', '1023', '65536', '193334444', '4444.5', '4e3', '-4444'])(
        'keeps invalid port %s visible with inline feedback without invoking the backend',
        async (value) => {
            useConfigMcpStore.setState({ enabled: true });
            render(<AdvancedSettings />);
            const input = screen.getByTestId('mcp-port-input');
            fireEvent.change(input, { target: { value } });
            fireEvent.blur(input);
            expect(await screen.findByRole('alert')).toHaveTextContent('mcp.advanced.invalid-port');
            expect(input).toHaveValue(value);
            expect(input).toHaveAttribute('aria-invalid', 'true');
            expect(invoke).not.toHaveBeenCalled();
        }
    );

    it('shows a port-in-use error and the saved port after a failed restart, then recovers on a new port', async () => {
        useConfigMcpStore.setState({ enabled: true });
        setMcpServerStatus(true, 19222);
        vi.mocked(invoke).mockImplementationOnce(async () => {
            // The command publishes the saved configuration before attempting a restart.
            useConfigMcpStore.setState({ port: 4444 });
            setMcpServerStatus(false, null);
            throw { kind: 'port_in_use', port: 4444 };
        });
        render(
            <>
                <ServerToggle />
                <AdvancedSettings />
            </>
        );
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '4444' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(await screen.findByRole('alert')).toHaveTextContent('mcp.errors.port-in-use');
        expect(input).toHaveValue('4444');
        expect(screen.getByTestId('mcp-server-status')).toHaveTextContent('mcp.server-toggle.status-stopped-port');
        expect(useMcpStore.getState().serverError).toEqual({ kind: 'port_in_use', port: 4444 });
        expect(screen.getByTestId('mcp-server-toggle')).toBeChecked();
        await waitFor(() => expect(input).not.toBeDisabled());
        vi.mocked(invoke).mockImplementationOnce(async () => {
            useConfigMcpStore.setState({ port: 4445 });
            setMcpServerStatus(true, 4445);
        });
        fireEvent.change(input, { target: { value: '4445' } });
        fireEvent.blur(input);
        await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
        expect(useMcpStore.getState().serverPort).toBe(4445);
        expect(invoke).toHaveBeenLastCalledWith('set_mcp_port', { port: 4445 });
    });

    it.each(['1024', '65535'])('accepts boundary port %s', async (value) => {
        useConfigMcpStore.setState({ enabled: true });
        vi.mocked(invoke).mockResolvedValue(undefined);
        render(<AdvancedSettings />);
        fireEvent.change(screen.getByTestId('mcp-port-input'), { target: { value } });
        fireEvent.blur(screen.getByTestId('mcp-port-input'));
        await waitFor(() => expect(invoke).toHaveBeenCalledWith('set_mcp_port', { port: Number(value) }));
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('does not issue two restarts when Enter is followed by blur while a save is pending', async () => {
        useConfigMcpStore.setState({ enabled: true });
        let finish: () => void = vi.fn();
        vi.mocked(invoke).mockImplementationOnce(
            () =>
                new Promise<void>((resolve) => {
                    finish = resolve;
                })
        );
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '4444' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        fireEvent.blur(input);
        expect(invoke).toHaveBeenCalledTimes(1);
        finish();
        await waitFor(() => expect(input).not.toBeDisabled());
    });
});
