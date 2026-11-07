/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@app/test/test-utils';
import { useConfigMcpStore } from '@app/store/useAppConfigStore';
import { useMcpStore } from '@app/store/useMcpStore';
import ServerToggle from './ServerToggle';

describe('ServerToggle', () => {
    beforeEach(() => {
        useConfigMcpStore.setState({ enabled: false });
        useMcpStore.setState({ serverRunning: false, serverPort: null, serverError: null });
    });

    describe('start errors', () => {
        it('explains that the configured port is taken', () => {
            useConfigMcpStore.setState({ enabled: true });
            useMcpStore.setState({ serverError: { kind: 'port_in_use', port: 4444 } });
            render(<ServerToggle />);

            expect(screen.getByText('mcp.server-toggle.status-stopped')).toBeInTheDocument();
            const alert = screen.getByRole('alert');
            expect(alert).toHaveAttribute('data-testid', 'mcp-server-error');
            expect(alert).toHaveTextContent('mcp.server-toggle.error-port-in-use');
        });

        it('shows other bind failures with their own message', () => {
            useConfigMcpStore.setState({ enabled: true });
            useMcpStore.setState({ serverError: { kind: 'bind_failed', port: 4444, message: 'access denied' } });
            render(<ServerToggle />);

            expect(screen.getByTestId('mcp-server-error')).toHaveTextContent('mcp.server-toggle.error-bind-failed');
        });

        it('hides the error once the server is running', () => {
            useConfigMcpStore.setState({ enabled: true });
            useMcpStore.setState({
                serverRunning: true,
                serverPort: 4445,
                serverError: { kind: 'port_in_use', port: 4444 },
            });
            render(<ServerToggle />);

            expect(screen.queryByTestId('mcp-server-error')).not.toBeInTheDocument();
        });

        it('hides the error when the server is disabled', () => {
            useMcpStore.setState({ serverError: { kind: 'port_in_use', port: 4444 } });
            render(<ServerToggle />);

            expect(screen.queryByTestId('mcp-server-error')).not.toBeInTheDocument();
        });

        it('shows no error after a normal stop', () => {
            useConfigMcpStore.setState({ enabled: true });
            render(<ServerToggle />);

            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });
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
});
