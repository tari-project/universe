import { beforeEach, describe, expect, it } from 'vitest';
import { isMcpPortBindError, setMcpPortError, setMcpServerStatus, useMcpStore } from './useMcpStore';

describe('useMcpStore port error state', () => {
    beforeEach(() => {
        useMcpStore.setState({
            serverRunning: false,
            serverPort: null,
            portError: null,
        });
    });

    it('records and clears portError via setMcpPortError', () => {
        setMcpPortError({ kind: 'in-use', port: 4444 });
        expect(useMcpStore.getState().portError).toEqual({ kind: 'in-use', port: 4444 });

        setMcpPortError(null);
        expect(useMcpStore.getState().portError).toBeNull();
    });

    it('preserves portError when setMcpServerStatus reports the server is stopped', () => {
        setMcpPortError({ kind: 'in-use', port: 4444 });
        setMcpServerStatus(false, null);

        expect(useMcpStore.getState().serverRunning).toBe(false);
        expect(useMcpStore.getState().portError).toEqual({ kind: 'in-use', port: 4444 });
    });

    it('clears portError automatically when setMcpServerStatus reports the server is running', () => {
        setMcpPortError({ kind: 'in-use', port: 4444 });
        setMcpServerStatus(true, 19222);

        expect(useMcpStore.getState().serverRunning).toBe(true);
        expect(useMcpStore.getState().serverPort).toBe(19222);
        expect(useMcpStore.getState().portError).toBeNull();
    });

    it('distinguishes MCP port bind errors from unrelated backend failures', () => {
        expect(
            isMcpPortBindError('MCP server failed to bind to configured port 4444: Address already in use')
        ).toBe(true);
        expect(isMcpPortBindError('MCP server is not enabled')).toBe(false);
    });
});
