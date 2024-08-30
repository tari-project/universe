/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

// disabling eslint rules as this is a logger

import { invoke } from '@tauri-apps/api';

// Override console functions
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleError = console.error;

const parseArgument = (a: any) => {
    try {
        return JSON.stringify(a, null, 2);
    } catch (_e) {
        // should we not return this err?
        return String(a);
    }
};

export const setupLogger = () => {
    // Override console.log
    console.log = function (...args) {
        invoke('log_web_message', {
            level: 'log',
            message: args.map(parseArgument),
        });
        originalConsoleLog(...args);
    };

    // Override console.info
    console.info = function (...args) {
        invoke('log_web_message', {
            level: 'info',
            message: args.map(parseArgument),
        });
        originalConsoleInfo(...args);
    };

    // Override console.error
    console.error = function (...args) {
        invoke('log_web_message', {
            level: 'error',
            message: args.map(parseArgument),
        });
        originalConsoleError(...args);
    };
};
