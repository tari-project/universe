// Markers in the error returned by `McpServerManager::start` in
// `src-tauri/src/mcp/server.rs` when the configured port cannot be bound.
const PORT_IN_USE_MARKERS = ['failed to bind to configured port', 'address already in use', 'eaddrinuse'];

export function isPortInUseError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    const lower = message.toLowerCase();
    return PORT_IN_USE_MARKERS.some((marker) => lower.includes(marker));
}
