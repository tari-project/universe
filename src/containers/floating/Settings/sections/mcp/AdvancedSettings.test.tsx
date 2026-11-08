/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import AdvancedSettings from './AdvancedSettings';

describe('AdvancedSettings', () => {
    beforeEach(() => {
        useConfigMcpStore.setState({
            enabled: false,
            port: 19222,
            read_tier_enabled: true,
            control_tier_enabled: true,
        });
        vi.mocked(invoke).mockReset();
    });

    it.each(['abc', '', '80', '65536', '4444.5', '193334444'])(
        'rejects invalid port %s with inline feedback',
        async (value) => {
            useConfigMcpStore.setState({ enabled: true });
            render(<AdvancedSettings />);
            const input = screen.getByTestId('mcp-port-input');
            fireEvent.change(input, { target: { value } });
            fireEvent.blur(input);
            expect(await screen.findByRole('alert')).toHaveTextContent('mcp.advanced.port-invalid');
            expect(input).toHaveAttribute('aria-invalid', 'true');
            expect(vi.mocked(invoke)).not.toHaveBeenCalled();
        },
    );

    it('shows a port conflict and clears it when the user edits the port', async () => {
        useConfigMcpStore.setState({ enabled: true });
        vi.mocked(invoke).mockRejectedValueOnce('Address already in use (os error 98)');
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '4444' } });
        fireEvent.blur(input);
        expect(await screen.findByRole('alert')).toHaveTextContent('mcp.advanced.port-in-use');
        expect(vi.mocked(invoke)).toHaveBeenCalledWith('set_mcp_port', { port: 4444 });
        fireEvent.change(input, { target: { value: '4445' } });
        await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    });

    it('commits a valid port without an error', async () => {
        useConfigMcpStore.setState({ enabled: true });
        vi.mocked(invoke).mockResolvedValueOnce(undefined);
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '4444' } });
        fireEvent.blur(input);
        await waitFor(() =>
            expect(vi.mocked(invoke)).toHaveBeenCalledWith('set_mcp_port', { port: 4444 }),
        );
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
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
