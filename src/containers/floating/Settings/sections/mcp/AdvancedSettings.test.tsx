/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/react';
import { invoke } from '@tauri-apps/api/core';
import { render, screen } from '@app/test/test-utils';
import { useMcpStore } from '@app/store/useMcpStore';
import ServerToggle from './ServerToggle';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import AdvancedSettings from './AdvancedSettings';

describe('AdvancedSettings', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset().mockResolvedValue(undefined);
        useMcpStore.setState({ serverError: null, serverRunning: false, serverPort: null });
        useConfigMcpStore.setState({
            port: 19222,
            enabled: false,
            read_tier_enabled: true,
            control_tier_enabled: true,
        });
    });

    it.each(['', 'abc', '1023', '65536', '4444.5', '4e3', '0x1234'])(
        'shows inline validation for invalid port %j without invoking the backend',
        (value) => {
            useConfigMcpStore.setState({ enabled: true });
            render(<AdvancedSettings />);
            const input = screen.getByTestId('mcp-port-input');
            fireEvent.change(input, { target: { value } });
            fireEvent.blur(input);
            expect(screen.getByRole('alert')).toHaveTextContent('mcp.errors.invalid-port');
            expect(input).toHaveValue(value);
            expect(input).toHaveAttribute('aria-invalid', 'true');
            expect(invoke).not.toHaveBeenCalled();
        }
    );

    it('shows a port conflict and the persisted port after restart failure, then recovers', async () => {
        useConfigMcpStore.setState({ enabled: true });
        vi.mocked(invoke).mockImplementationOnce(async () => {
            useConfigMcpStore.setState({ port: 4444 });
            throw 'MCP_PORT_IN_USE:4444: address already in use';
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
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('mcp.errors.port-in-use'));
        expect(input).toHaveValue('4444');
        expect(useMcpStore.getState().serverError?.port).toBe(4444);
        expect(screen.getByTestId('mcp-server-status')).toHaveTextContent('mcp.server-toggle.status-stopped');
        fireEvent.change(input, { target: { value: '5555' } });
        fireEvent.blur(input);
        await waitFor(() => expect(invoke).toHaveBeenLastCalledWith('set_mcp_port', { port: 5555 }));
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('does not mislabel other bind failures as an occupied port', async () => {
        useConfigMcpStore.setState({ enabled: true });
        vi.mocked(invoke).mockRejectedValueOnce('MCP server failed to bind: permission denied');
        render(
            <>
                <ServerToggle />
                <AdvancedSettings />
            </>
        );
        fireEvent.change(screen.getByTestId('mcp-port-input'), { target: { value: '4444' } });
        fireEvent.blur(screen.getByTestId('mcp-port-input'));
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('mcp.errors.start-failed'));
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
