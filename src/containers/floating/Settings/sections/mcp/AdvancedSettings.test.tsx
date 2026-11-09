/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { invoke } from '@tauri-apps/api/core';
import AdvancedSettings from './AdvancedSettings';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

// The shared test setup returns bare keys; interpolate the port here so the
// assertions cover the message the user actually sees.
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, params?: { port?: number }) =>
            key.startsWith('mcp.advanced.port-') && params?.port !== undefined ? `${key}|${params.port}` : key,
        i18n: { language: 'en', changeLanguage: vi.fn() },
    }),
    initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

describe('AdvancedSettings', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
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

    it('shows inline feedback for an out-of-range port instead of silently resetting it', async () => {
        useConfigMcpStore.setState({ enabled: true });
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '999' } });
        fireEvent.blur(input);
        expect(await screen.findByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-invalid');
        expect(input).toHaveValue(999);
        expect(vi.mocked(invoke)).not.toHaveBeenCalled();
    });

    it('shows inline feedback for an empty port instead of silently resetting it', async () => {
        useConfigMcpStore.setState({ enabled: true });
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '' } });
        fireEvent.blur(input);
        expect(await screen.findByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-invalid');
        expect(vi.mocked(invoke)).not.toHaveBeenCalled();
    });

    it('shows a port-in-use message naming the port when the backend refuses to bind', async () => {
        useConfigMcpStore.setState({ enabled: true });
        vi.mocked(invoke).mockRejectedValueOnce(
            'MCP server failed to bind to configured port 4444: Address already in use'
        );
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '4444' } });
        fireEvent.blur(input);
        expect(await screen.findByTestId('mcp-port-error')).toHaveTextContent('mcp.advanced.port-in-use|4444');
        expect(vi.mocked(invoke)).toHaveBeenCalledWith('set_mcp_port', { port: 4444 });
        // The backend saves the port before it restarts, so the panel must show it
        // as the configured port while the server is stopped.
        expect(useConfigMcpStore.getState().port).toBe(4444);
        expect(input).toHaveValue(4444);
    });

    it('clears the port error when the value changes', async () => {
        useConfigMcpStore.setState({ enabled: true });
        vi.mocked(invoke).mockRejectedValueOnce(
            'MCP server failed to bind to configured port 4444: Address already in use'
        );
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '4444' } });
        fireEvent.blur(input);
        await screen.findByTestId('mcp-port-error');
        fireEvent.change(input, { target: { value: '4445' } });
        expect(screen.queryByTestId('mcp-port-error')).not.toBeInTheDocument();
    });

    it('retries the same saved port after a bind failure', async () => {
        useConfigMcpStore.setState({ enabled: true });
        vi.mocked(invoke).mockRejectedValueOnce(
            'MCP server failed to bind to configured port 4444: Address already in use'
        );
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '4444' } });
        fireEvent.blur(input);
        await screen.findByTestId('mcp-port-error');
        vi.mocked(invoke).mockResolvedValueOnce(undefined);
        fireEvent.keyDown(input, { key: 'Enter' });
        await waitFor(() => expect(vi.mocked(invoke)).toHaveBeenCalledTimes(2));
    });

    it('commits a valid port', async () => {
        useConfigMcpStore.setState({ enabled: true });
        render(<AdvancedSettings />);
        const input = screen.getByTestId('mcp-port-input');
        fireEvent.change(input, { target: { value: '19333' } });
        fireEvent.blur(input);
        await waitFor(() => expect(vi.mocked(invoke)).toHaveBeenCalledWith('set_mcp_port', { port: 19333 }));
    });
});
