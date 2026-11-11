/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@app/test/test-utils';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useMcpStore } from '@app/store/useMcpStore';
import ServerToggle from './ServerToggle';
import AdvancedSettings from './AdvancedSettings';
import { invoke } from '@tauri-apps/api/core';

describe('ServerToggle', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        useConfigMcpStore.setState({ enabled: false, port: 4444 });
        useMcpStore.setState({ serverRunning: false, serverPort: null, serverError: null });
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
        expect(screen.getByText('mcp.server-toggle.status-stopped-port')).toBeInTheDocument();
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
        useConfigMcpStore.setState({ enabled: false, port: 4444 });
        render(<ServerToggle />);
        expect(screen.getByRole('checkbox')).not.toBeChecked();
    });
    it.each(['port_in_use', 'start_failed'])(
        'shows a translatable %s error on enable and leaves the saved port editable',
        async (kind) => {
            vi.mocked(invoke).mockImplementationOnce(async () => {
                useConfigMcpStore.setState({ enabled: true });
                throw { kind, port: 4444 };
            });
            render(
                <>
                    <ServerToggle />
                    <AdvancedSettings />
                </>
            );
            fireEvent.click(screen.getByTestId('mcp-server-toggle'));
            const key = kind === 'port_in_use' ? 'mcp.errors.port-in-use' : 'mcp.errors.start-failed';
            expect(await screen.findByRole('alert')).toHaveTextContent(key);
            expect(screen.getByTestId('mcp-port-input')).toHaveValue('4444');
            expect(screen.getByTestId('mcp-server-toggle')).toBeChecked();
            expect(useMcpStore.getState().serverRunning).toBe(false);
            expect(useMcpStore.getState().serverError).toEqual({ kind, port: 4444 });
            await waitFor(() => expect(screen.getByTestId('mcp-server-toggle')).not.toBeDisabled());
        }
    );

    it('shows a generic error if configuration cannot be saved, without pretending the server was enabled', async () => {
        vi.mocked(invoke).mockRejectedValueOnce({ kind: 'configuration', message: 'disk error' });
        render(<ServerToggle />);
        fireEvent.click(screen.getByRole('checkbox'));
        expect(await screen.findByRole('alert')).toHaveTextContent('mcp.errors.configuration');
        expect(screen.getByRole('checkbox')).not.toBeChecked();
    });
});
