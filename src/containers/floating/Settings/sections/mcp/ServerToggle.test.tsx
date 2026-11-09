/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useMcpStore } from '@app/store/useMcpStore';
import { invoke } from '@tauri-apps/api/core';
import ServerToggle from './ServerToggle';

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

describe('ServerToggle', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        useConfigMcpStore.setState({ enabled: false, port: 19222 });
        useMcpStore.setState({ serverRunning: false, serverPort: null });
    });

    it('renders title', () => {
        render(<ServerToggle />);
        expect(screen.getByText('mcp.server-toggle.title')).toBeInTheDocument();
    });

    it('renders description', () => {
        render(<ServerToggle />);
        expect(screen.getByText('mcp.server-toggle.description')).toBeInTheDocument();
    });

    it('shows stopped status when server is not running', () => {
        render(<ServerToggle />);
        expect(screen.getByText('mcp.server-toggle.status-stopped')).toBeInTheDocument();
    });

    it('shows running status when server is running', () => {
        useMcpStore.setState({ serverRunning: true, serverPort: 19222 });
        render(<ServerToggle />);
        expect(screen.getByText('mcp.server-toggle.status-running')).toBeInTheDocument();
    });

    it('renders toggle switch', () => {
        render(<ServerToggle />);
        expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('toggle reflects enabled state', () => {
        useConfigMcpStore.setState({ enabled: true });
        render(<ServerToggle />);
        expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('toggle reflects disabled state', () => {
        useConfigMcpStore.setState({ enabled: false });
        render(<ServerToggle />);
        expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('shows the bind failure when enabling on an occupied port', async () => {
        vi.mocked(invoke).mockRejectedValueOnce(
            'MCP server failed to bind to configured port 19222: Address already in use'
        );
        render(<ServerToggle />);
        fireEvent.click(screen.getByRole('checkbox'));
        expect(await screen.findByTestId('mcp-server-error')).toHaveTextContent('mcp.advanced.port-in-use|19222');
        // The backend saved enabled=true before failing to start. Keeping that in
        // the store leaves the port field visible so the user can pick another port.
        expect(useConfigMcpStore.getState().enabled).toBe(true);
        await waitFor(() => expect(screen.getByRole('checkbox')).toBeChecked());
    });

    it('shows a generic start error for a non-bind failure', async () => {
        vi.mocked(invoke).mockRejectedValueOnce('MCP server has no bearer token configured');
        render(<ServerToggle />);
        fireEvent.click(screen.getByRole('checkbox'));
        expect(await screen.findByTestId('mcp-server-error')).toHaveTextContent('mcp.advanced.port-error|19222');
    });

    it('clears a previous bind failure on the next attempt', async () => {
        vi.mocked(invoke).mockRejectedValueOnce('MCP server failed to bind to configured port 19222');
        render(<ServerToggle />);
        const toggle = screen.getByRole('checkbox');
        fireEvent.click(toggle);
        await screen.findByTestId('mcp-server-error');
        vi.mocked(invoke).mockResolvedValueOnce(undefined);
        fireEvent.click(toggle);
        await waitFor(() => expect(screen.queryByTestId('mcp-server-error')).not.toBeInTheDocument());
    });

    it('clears the error once the server is running again', async () => {
        vi.mocked(invoke).mockRejectedValueOnce('MCP server failed to bind to configured port 19222');
        render(<ServerToggle />);
        fireEvent.click(screen.getByRole('checkbox'));
        await screen.findByTestId('mcp-server-error');
        act(() => useMcpStore.setState({ serverRunning: true, serverPort: 19222 }));
        await waitFor(() => expect(screen.queryByTestId('mcp-server-error')).not.toBeInTheDocument());
    });
});
