import { invoke } from '@tauri-apps/api/core';
const universeVersion = import.meta.env.VITE_TARI_UNIVERSE_VERSION;

// Override console functions

const originalConsole = {
    info: console.info,
    warn: console.warn,
    error: console.error,
};

type InfoArgs = Console['info'];
type WarnArgs = Console['warn'];
type ErrorArgs = Console['error'];

type ParseArgs = ErrorArgs | InfoArgs | WarnArgs;

const parseArgument = (a?: ParseArgs): string => {
    try {
        const argument = a?.toString()?.length ? a : 'FE Log Item';
        return JSON.stringify(argument, null, 2);
    } catch (e) {
        return String(`Logger Parse Error from ${a} - ${e}`);
    }
};

const getOptions = (args, level) => {
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
