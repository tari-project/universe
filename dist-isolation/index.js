window.__TAURI_ISOLATION_HOOK__ = (payload) => {
    // TODO: Prevent command execution
    // TODO: Perhaps whitelist commands
    return payload
}