/* eslint-disable no-console */
import { invoke } from '@tauri-apps/api';

// Override console functions

const originalConsole = {
    log: console.log,
    error: console.error,
    info: console.info,
};

type LogArgs = Console['log'];
type ErrorArgs = Console['error'];
type InfoArgs = Console['info'];

type ParseArgs = LogArgs | ErrorArgs | InfoArgs;

const parseArgument = (a?: ParseArgs) => {
    try {
        const message = a || 'Log Item';
        return JSON.stringify(message, null, 2);
    } catch (e) {
        return String(`Logger Parse Error from ${a} - ${e}`);
    }
};

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE == 'development';

const getOptions = (args, level) => {
    void invoke('log_web_message', {
        level: isDevelopment ? `info` : level, // so it isn't logged to sentry if error
        message: args.map(parseArgument),
    });
    return originalConsole[level](...args);
};

export const setupLogger = () => {
    // Override
    console.log = (...args) => getOptions(args, 'log');
    console.info = (...args) => getOptions(args, 'info');
    console.error = (...args) => getOptions(args, 'error');
};
