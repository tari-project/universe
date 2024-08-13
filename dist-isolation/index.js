window.__TAURI_ISOLATION_HOOK__ = (payload) => {
    // console.debug("Isolation hook called with payload:", payload);
    // TODO: Prevent command execution
    // TODO: Perhaps whitelist commands
    return payload;
};
