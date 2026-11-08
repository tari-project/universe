import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { describeMcpPortError } from './describeMcpPortError';

const t = ((key: string, params?: { port: number }) => `${key}:${params?.port}`) as TFunction;

describe('describeMcpPortError', () => {
    it.each([
        'Address already in use (os error 98)',
        'AddrInUse',
        'Only one usage of each socket address is normally permitted (os error 10048)',
        'bind failed (os error 48)',
    ])('renders a translated port-in-use key for %s', (message) => {
        expect(describeMcpPortError(message, 4444, t)).toBe('mcp.advanced.port-in-use:4444');
    });

    it('hides unexpected errors from the UI', () => {
        expect(describeMcpPortError(new Error('internal secret'), 4545, t)).toBe(
            'mcp.advanced.port-start-failed:4545',
        );
    });
});
