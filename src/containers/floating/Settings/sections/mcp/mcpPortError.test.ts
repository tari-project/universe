import { describe, expect, it } from 'vitest';
import en from '../../../../../../public/locales/en/settings.json';
import { isPortInUseError } from './mcpPortError';

const advancedStrings = en.mcp.advanced as Record<string, string>;

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

describe('English messages', () => {
    it('names the port and says what to do next', () => {
        expect(advancedStrings['port-in-use']).toBe('Port {{port}} is already in use. Choose another port.');
    });

    it('explains the valid range for invalid input', () => {
        expect(advancedStrings['port-invalid']).toBe('Port must be a whole number between 1024 and 65535.');
    });

    it('has a fallback for other start failures', () => {
        expect(advancedStrings['port-error']).toContain('Could not start the MCP server on port {{port}}');
    });
});
