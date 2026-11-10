import type { McpPortError } from '@app/store/useMcpStore';

export const MCP_PORT_MIN = 1024;
export const MCP_PORT_MAX = 65535;

/**
 * Checks what the user typed into the port field before anything is sent to the backend.
 * Returns the error to show, or `null` when the value is a usable port.
 */
export function validatePortInput(raw: string): McpPortError | null {
    const trimmed = raw.trim();
    // `Number('')` and `Number(' 12 ')` are both numbers, so check the digits explicitly.
    if (!/^\d+$/.test(trimmed)) return { kind: 'invalid', value: trimmed };
    const port = Number(trimmed);
    if (port < MCP_PORT_MIN || port > MCP_PORT_MAX) return { kind: 'out-of-range', value: trimmed };
    return null;
}

function messageOf(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    return String(error);
}

/**
 * Turns a rejected `invoke` into the message the panel shows. The backend refuses to fall back to
 * a random port, so a bind failure is reported as the configured port being taken.
 */
export function parsePortError(error: unknown, port: number): McpPortError {
    const message = messageOf(error);
    if (/failed to bind/i.test(message)) return { kind: 'in-use', port };
    return { kind: 'unknown', message };
}
