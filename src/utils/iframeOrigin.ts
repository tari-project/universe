/**
 * The origin an embedded iframe will speak from, derived from the URL we pointed it at.
 * Returns `null` when the source is empty or cannot be parsed (including opaque `null`
 * origins), in which case no message channel with that iframe may be trusted.
 */
export function getIframeOrigin(source: string | null | undefined): string | null {
    if (!source) return null;

    try {
        const { origin } = new URL(source, window.location.href);
        return origin && origin !== 'null' ? origin : null;
    } catch {
        return null;
    }
}
