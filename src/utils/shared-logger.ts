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

const getStackTrace = function () {
    const obj: Record<string, unknown> = {};
    Error.captureStackTrace(obj, getStackTrace);
    return obj.stack;
};

const getOptions = (args, level) => {
    const trace = getStackTrace();
    invoke('log_web_message', {
        level,
        message: args?.map(parseArgument),
        trace,
    });
    return originalConsole[level](...args);
};

export const setupLogger = () => {
    // Override
    console.log = (...args) => getOptions(args, 'log');
    console.info = (...args) => getOptions(args, 'info');
    console.error = (...args) => getOptions(args, 'error');
};
