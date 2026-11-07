/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@app/test/test-utils';
import { invoke } from '@tauri-apps/api/core';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import AdvancedSettings from './AdvancedSettings';

const invokeMock = vi.mocked(invoke) as unknown as Mock<(command: string, args?: unknown) => Promise<unknown>>;

function enterPort(value: string) {
    const input = screen.getByTestId('mcp-port-input');
    fireEvent.change(input, { target: { value } });
    fireEvent.keyDown(input, { key: 'Enter' });
    return input;
}

describe('AdvancedSettings', () => {
    beforeEach(() => {
        invokeMock.mockReset();
        invokeMock.mockResolvedValue(undefined);
        useConfigMcpStore.setState({
            enabled: false,
            port: 19222,
            read_tier_enabled: true,
            control_tier_enabled: true,
        });
    });

    describe('port input', () => {
        beforeEach(() => {
            useConfigMcpStore.setState({ enabled: true });
        });

        it.each([['193334444'], ['80'], ['65536'], ['4444.5'], ['']])(
            'shows inline feedback and keeps the typed value for %j',
            (value) => {
                render(<AdvancedSettings />);
                const input = enterPort(value);

                expect(screen.getByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-invalid');
                expect(input).toHaveAttribute('aria-invalid', 'true');
                expect(input).toHaveValue(value === '' ? null : Number(value));
                expect(invokeMock).not.toHaveBeenCalledWith('set_mcp_port', expect.anything());
            }
        );

        it('clears the inline feedback once the user edits the value', () => {
            render(<AdvancedSettings />);
            const input = enterPort('80');
            expect(screen.getByTestId('mcp-port-error')).toBeInTheDocument();

            fireEvent.change(input, { target: { value: '808' } });
            expect(screen.queryByTestId('mcp-port-error')).not.toBeInTheDocument();
        });

        it('sends a valid port to the backend without showing feedback', async () => {
            render(<AdvancedSettings />);
            enterPort('4444');

            await waitFor(() => expect(invokeMock).toHaveBeenCalledWith('set_mcp_port', { port: 4444 }));
            expect(screen.queryByTestId('mcp-port-error')).not.toBeInTheDocument();
        });

        it('does not call the backend when the port is unchanged', () => {
            render(<AdvancedSettings />);
            enterPort('19222');
            expect(invokeMock).not.toHaveBeenCalledWith('set_mcp_port', expect.anything());
        });

        it('shows the port the backend saved when the restart fails', async () => {
            // The backend saves the new port, emits it, then rejects because the port is taken.
            invokeMock.mockImplementation(async (cmd) => {
                if (cmd === 'set_mcp_port') {
                    useConfigMcpStore.setState({ port: 4444 });
                    throw 'MCP server failed to bind to configured port 4444';
                }
                return undefined;
            });
            render(<AdvancedSettings />);
            const input = enterPort('4444');

            await waitFor(() => expect(input).toHaveValue(4444));
            expect(screen.queryByTestId('mcp-port-error')).not.toBeInTheDocument();
        });

        it('falls back to the stored port when the backend rejects before saving', async () => {
            invokeMock.mockImplementation(async (cmd) => {
                if (cmd === 'set_mcp_port') throw 'config write failed';
                return undefined;
            });
            render(<AdvancedSettings />);
            const input = enterPort('4444');

            await waitFor(() => expect(invokeMock).toHaveBeenCalledWith('set_mcp_port', { port: 4444 }));
            await waitFor(() => expect(input).toHaveValue(19222));
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
