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
    const obj: Record<string, string> = {};
    Error.captureStackTrace(obj, getStackTrace);

    const splitStack = obj.stack.split('\n');
    splitStack.shift();

    return splitStack;
};

const getOptions = (args, level) => {
    const trace = getStackTrace();
    void invoke('log_web_message', {
        level,
        message: args?.map(parseArgument),
        trace: level === 'error' ? trace : trace.slice(0, 1), // so it doesn't get too noisy
    });
    return originalConsole[level](...args);
};

export const setupLogger = () => {
    // Override
    console.log = (...args) => getOptions(args, 'log');
    console.info = (...args) => getOptions(args, 'info');
    console.error = (...args) => getOptions(args, 'error');
};
