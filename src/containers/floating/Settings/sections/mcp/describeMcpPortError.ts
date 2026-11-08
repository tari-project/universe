import type { TFunction } from 'i18next';

/** Convert OS-dependent bind errors into safe, translatable UI feedback. */
export function describeMcpPortError(error: unknown, port: number, t: TFunction): string {
    const message = String(error);
    if (/address already in use|addrinuse|os error (98|48|10048)/i.test(message)) {
        return t('mcp.advanced.port-in-use', { port });
    }
    return t('mcp.advanced.port-start-failed', { port });
}
