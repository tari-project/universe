/* eslint-disable no-console */

// disabling eslint rules as this is a logger

import { invoke } from '@tauri-apps/api';

// Override console functions
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleError = console.error;

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

export const setupLogger = () => {
    // Override console.log
    console.log = (...args) => {
        invoke('log_web_message', {
            level: 'log',
            message: args?.map(parseArgument),
        });
        return originalConsoleLog(...args);
    };

    // Override console.info
    console.info = (...args) => {
        invoke('log_web_message', {
            level: 'info',
            message: args?.map(parseArgument),
        });
        return originalConsoleInfo(...args);
    };

    // Override console.error
    console.error = (...args) => {
        invoke('log_web_message', {
            level: 'error',
            message: args?.map(parseArgument),
        });
        return originalConsoleError(...args);
    };
};
