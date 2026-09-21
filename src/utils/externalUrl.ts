const ALLOWED_EXTERNAL_PROTOCOLS = ['http:', 'https:'];

/**
 * Validates a URL before it is handed to the OS shell handler (`@tauri-apps/plugin-shell`'s `open`).
 * Only absolute http(s) URLs are allowed: anything else (`javascript:`, `file:`, custom app schemes, ...)
 * must never reach the shell.
 */
export function isAllowedExternalUrl(url: unknown): url is string {
    if (typeof url !== 'string' || url.length === 0) return false;

    try {
        return ALLOWED_EXTERNAL_PROTOCOLS.includes(new URL(url).protocol);
    } catch {
        return false;
    }
}
