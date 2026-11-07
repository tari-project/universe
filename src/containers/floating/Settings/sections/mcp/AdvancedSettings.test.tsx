/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@app/test/test-utils';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import AdvancedSettings from './AdvancedSettings';

const invokeMock = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({ invoke: (...args: unknown[]) => invokeMock(...args) }));

describe('AdvancedSettings', () => {
    beforeEach(() => {
        invokeMock.mockReset();
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

describe('AdvancedSettings port errors', () => {
    it('shows an inline message when the port is out of range', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 4444 });
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '99999' } });
        fireEvent.blur(input);
        expect(await screen.findByTestId('mcp-port-error')).toBeInTheDocument();
        expect(invokeMock).not.toHaveBeenCalled();
    });

    it('shows an inline message when the entry is not a number', async () => {
        useConfigMcpStore.setState({ enabled: true, port: 4444 });
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input') as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'abc' } });
        fireEvent.blur(input);
        expect(await screen.findByTestId('mcp-port-error')).toBeInTheDocument();
        expect(invokeMock).not.toHaveBeenCalled();
    });

    it('reports the occupied port when the backend refuses the bind', async () => {
        invokeMock.mockRejectedValueOnce(
            'MCP server failed to bind to configured port 4444: Address already in use. ' +
                'Refusing to fall back to a random port for security reasons'
        );
        useConfigMcpStore.setState({ enabled: true, port: 5555 });
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '4444' } });
        fireEvent.blur(input);
        const alert = await screen.findByTestId('mcp-port-error');
        expect(alert).toBeInTheDocument();
        // the shared i18n mock returns the key, so the message itself is
        // asserted via the key; the occupied port is carried as a parameter.
        expect(alert.textContent).toBe('mcp.advanced.port-in-use');
        // the field goes back to the stored port so it matches reality
        expect(input.value).toBe('5555');
    });

    it('clears the message once the port is accepted', async () => {
        invokeMock.mockResolvedValue(undefined);
        useConfigMcpStore.setState({ enabled: true, port: 5555 });
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '4444' } });
        fireEvent.blur(input);
        expect(invokeMock).toHaveBeenCalledWith('set_mcp_port', { port: 4444 });
        expect(screen.queryByTestId('mcp-port-error')).not.toBeInTheDocument();
    });
});
