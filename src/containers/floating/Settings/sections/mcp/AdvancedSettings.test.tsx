/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@app/test/test-utils';
import { invoke } from '@tauri-apps/api/core';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useMcpStore } from '@app/store/useMcpStore';
import AdvancedSettings from './AdvancedSettings';

const mockInvoke = vi.mocked(invoke);

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

    describe('port validation and error display', () => {
        const BIND_ERROR =
            'MCP server failed to bind to configured port 4444: Address already in use (os error 98). ' +
            'Refusing to fall back to a random port for security reasons';

        beforeEach(() => {
            mockInvoke.mockReset();
            mockInvoke.mockResolvedValue(undefined);
            useConfigMcpStore.setState({ enabled: true, port: 19222 });
        });

        const commitValue = (value: string) => {
            const input = screen.getByTestId('mcp-port-input');
            fireEvent.change(input, { target: { value } });
            fireEvent.keyDown(input, { key: 'Enter' });
            return input;
        };

        it('shows range feedback for a port below 1024 and does not call the backend', () => {
            render(<AdvancedSettings />);
            commitValue('80');
            expect(screen.getByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-range-error');
            expect(mockInvoke).not.toHaveBeenCalled();
        });

        it('shows range feedback for an out-of-range value typed over existing digits', () => {
            render(<AdvancedSettings />);
            commitValue('193334444');
            expect(screen.getByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-range-error');
            expect(mockInvoke).not.toHaveBeenCalled();
        });

        it('shows not-a-number feedback for a non-integer port', () => {
            render(<AdvancedSettings />);
            commitValue('4444.5');
            expect(screen.getByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-invalid-error');
            expect(mockInvoke).not.toHaveBeenCalled();
        });

        it('shows not-a-number feedback for non-numeric input and does not call the backend', () => {
            render(<AdvancedSettings />);
            commitValue('abc');
            expect(screen.getByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-invalid-error');
            expect(mockInvoke).not.toHaveBeenCalled();
        });

        it('clears the error as soon as the user edits the field', () => {
            render(<AdvancedSettings />);
            const input = commitValue('80');
            expect(screen.getByTestId('mcp-port-error')).toBeInTheDocument();
            fireEvent.change(input, { target: { value: '4444' } });
            expect(screen.queryByTestId('mcp-port-error')).toBeNull();
        });

        it('shows a port-in-use message when the backend rejects the bind', async () => {
            mockInvoke.mockRejectedValueOnce(BIND_ERROR);
            render(<AdvancedSettings />);
            const input = commitValue('4444');
            const error = await screen.findByTestId('mcp-port-error');
            expect(error).toHaveTextContent('mcp.advanced.port-in-use');
            expect(error).toHaveAttribute('role', 'alert');
            // The attempted port stays visible so the user sees what is configured
            expect(input).toHaveValue(4444);
            // ...and the store holds it too: the backend already persisted it
            expect(useConfigMcpStore.getState().port).toBe(4444);
        });

        it('shows not-a-number feedback for exponent notation instead of silently using port 4000', () => {
            render(<AdvancedSettings />);
            commitValue('4e3');
            expect(screen.getByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-invalid-error');
            expect(mockInvoke).not.toHaveBeenCalled();
        });

        it('shows not-a-number feedback for a trailing decimal point value', () => {
            render(<AdvancedSettings />);
            commitValue('4444.0');
            expect(screen.getByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-invalid-error');
            expect(mockInvoke).not.toHaveBeenCalled();
        });

        it('retries the bind when the same port is committed again after a failure', async () => {
            mockInvoke.mockRejectedValueOnce(BIND_ERROR);
            render(<AdvancedSettings />);
            const input = commitValue('4444');
            await screen.findByTestId('mcp-port-error');
            fireEvent.keyDown(input, { key: 'Enter' });
            await waitFor(() => expect(mockInvoke).toHaveBeenCalledTimes(2));
            expect(mockInvoke).toHaveBeenLastCalledWith('set_mcp_port', { port: 4444 });
            expect(screen.queryByTestId('mcp-port-error')).toBeNull();
        });

        it('does not run a second commit while the first one is still in flight', async () => {
            let release!: () => void;
            mockInvoke.mockImplementationOnce(
                () =>
                    new Promise<void>((resolve) => {
                        release = resolve;
                    })
            );
            render(<AdvancedSettings />);
            const input = commitValue('4444');
            fireEvent.blur(input);
            expect(mockInvoke).toHaveBeenCalledTimes(1);
            release();
            await waitFor(() => expect(useConfigMcpStore.getState().port).toBe(4444));
        });

        it('shows a generic update message when the backend fails for another reason', async () => {
            mockInvoke.mockRejectedValueOnce('MCP server has no bearer token configured');
            render(<AdvancedSettings />);
            commitValue('4444');
            const error = await screen.findByTestId('mcp-port-error');
            expect(error).toHaveTextContent('mcp.advanced.port-update-failed');
            expect(error).not.toHaveTextContent('port-in-use');
        });

        it('commits a valid free port without showing an error', async () => {
            render(<AdvancedSettings />);
            commitValue('4444');
            await waitFor(() => expect(mockInvoke).toHaveBeenCalledWith('set_mcp_port', { port: 4444 }));
            expect(screen.queryByTestId('mcp-port-error')).toBeNull();
            expect(useConfigMcpStore.getState().port).toBe(4444);
        });

        it('retries the saved port when the server is stopped and the value is unchanged', async () => {
            useMcpStore.setState({ serverRunning: false, serverPort: null });
            useConfigMcpStore.setState({ port: 4444 });
            render(<AdvancedSettings />);
            const input = screen.getByTestId('mcp-port-input');
            fireEvent.keyDown(input, { key: 'Enter' });
            await waitFor(() => expect(mockInvoke).toHaveBeenCalledWith('set_mcp_port', { port: 4444 }));
        });

        it('does not restart when the server is already running on the saved port', () => {
            useMcpStore.setState({ serverRunning: true, serverPort: 4444 });
            useConfigMcpStore.setState({ port: 4444 });
            render(<AdvancedSettings />);
            const input = screen.getByTestId('mcp-port-input');
            fireEvent.keyDown(input, { key: 'Enter' });
            expect(mockInvoke).not.toHaveBeenCalled();
            useMcpStore.setState({ serverRunning: false, serverPort: null });
        });

        it.each(['0', '1023', '65536'])(
            'shows range feedback for out-of-range port %s without calling the backend',
            (value) => {
                render(<AdvancedSettings />);
                commitValue(value);
                expect(screen.getByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-range-error');
                expect(mockInvoke).not.toHaveBeenCalled();
            }
        );

        it('shows not-a-number feedback for an empty port and does not call the backend', () => {
            render(<AdvancedSettings />);
            commitValue('');
            expect(screen.getByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-invalid-error');
            expect(mockInvoke).not.toHaveBeenCalled();
        });

        it.each([1024, 65535])('commits boundary port %i without showing an error', async (port) => {
            render(<AdvancedSettings />);
            commitValue(String(port));
            await waitFor(() => expect(mockInvoke).toHaveBeenCalledWith('set_mcp_port', { port }));
            expect(screen.queryByTestId('mcp-port-error')).toBeNull();
            expect(useConfigMcpStore.getState().port).toBe(port);
        });
    });
});
