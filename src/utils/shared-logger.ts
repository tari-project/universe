import { invoke } from '@tauri-apps/api/core';
const universeVersion = import.meta.env.VITE_TARI_UNIVERSE_VERSION;

// Override console functions

const originalConsole = {
    info: console.info,
    warn: console.warn,
    error: console.error,
};

const parseArgument = (a?: unknown): string => {
    try {
        if (typeof a === 'string') {
            return a.length ? a : 'FE Log Item';
        }
        if (typeof a === 'number' || typeof a === 'boolean' || typeof a === 'bigint') {
            return String(a);
        }
        if (a instanceof Error) {
            return a.stack || a.message || String(a);
        }
        const serialized = a !== undefined && a !== null ? JSON.stringify(a) : '';
        return serialized && serialized.length ? serialized : 'FE Log Item';
    } catch (e) {
        return String(`Logger Parse Error from ${a} - ${e}`);
    }
};

const getOptions = (args: unknown[], level: keyof typeof originalConsole) => {
    const mapped = args.map(parseArgument);
    void invoke('log_web_message', {
        level,
        message: [universeVersion, ...mapped],
    });
    return originalConsole[level](...args);
};

const setupLogger = () => {
    // Override
    console.warn = (...args) => getOptions(args, 'warn');
    console.info = (...args) => getOptions(args, 'info');
    console.error = (...args) => getOptions(args, 'error');
};

export default setupLogger;
