/** Marker returned by the backend when the configured port is already taken. */
const PORT_IN_USE = /MCP_PORT_IN_USE:(\d{1,5})/;

const MIN_PORT = 1024;
const MAX_PORT = 65535;

function invokeErrorText(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
        return error.message;
    }
    return String(error);
}

/** A whole port in the range the backend will actually bind. */
export function parsePortDraft(value: string): { port: number } | null {
    const trimmed = value.trim();
    if (!/^\d{1,5}$/.test(trimmed)) return null;
    const port = Number(trimmed);
    if (port < MIN_PORT || port > MAX_PORT) return null;
    return { port };
}

/** Port named by a bind failure, or null when the command failed for another reason. */
export function portInUseFromInvokeError(error: unknown): number | null {
    const match = PORT_IN_USE.exec(invokeErrorText(error));
    if (!match) return null;
    const port = Number(match[1]);
    return port <= MAX_PORT ? port : null;
}

/**
 * True when the command saved the new settings and then failed to bind.
 * A save error does not contain either marker, so the panel must keep the previous port.
 */
export function mcpBindWasAttempted(error: unknown): boolean {
    const text = invokeErrorText(error);
    return text.includes('MCP_PORT_IN_USE:') || text.includes('failed to bind');
}
