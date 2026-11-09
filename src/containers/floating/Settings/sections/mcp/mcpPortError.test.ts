import { describe, expect, it } from 'vitest';
import { isPortInUseError } from './mcpPortError';

describe('isPortInUseError', () => {
    it('recognises the bind error built by McpServerManager::start', () => {
        expect(
            isPortInUseError(
                'MCP server failed to bind to configured port 4444: Address already in use (os error 98). ' +
                    'Refusing to fall back to a random port for security reasons'
            )
        ).toBe(true);
    });

    it('recognises the raw OS error', () => {
        expect(isPortInUseError(new Error('bind: EADDRINUSE'))).toBe(true);
        expect(isPortInUseError('Address already in use')).toBe(true);
    });

    it('does not treat other start failures as a port conflict', () => {
        expect(isPortInUseError('MCP server has no bearer token configured')).toBe(false);
        expect(isPortInUseError(undefined)).toBe(false);
    });
});
