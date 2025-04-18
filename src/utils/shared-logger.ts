/* eslint-disable no-console */
import { invoke } from '@tauri-apps/api/core';
const universeVersion = import.meta.env.VITE_TARI_UNIVERSE_VERSION;

// Override console functions

const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
};

type LogArgs = Console['log'];
type InfoArgs = Console['info'];
type WarnArgs = Console['warn'];
type ErrorArgs = Console['error'];

type ParseArgs = LogArgs | ErrorArgs | InfoArgs | WarnArgs;

const parseArgument = (a?: ParseArgs): string => {
    try {
        const argument = a || 'FE Log Item';
        return JSON.stringify(argument, null, 2);
    } catch (e) {
        return String(`Logger Parse Error from ${a} - ${e}`);
    }
};

const getOptions = (args, level) => {
    void invoke('log_web_message', {
        level,
        message: [`v${universeVersion} - `, ...args.map(parseArgument)],
    });
    return originalConsole[level](...args);
};

const setupLogger = () => {
    // Override
    console.log = (...args) => getOptions(args, 'log');
    console.info = (...args) => getOptions(args, 'info');
    console.warn = (...args) => getOptions(args, 'warn');
    console.error = (...args) => getOptions(args, 'error');
};

export default setupLogger;
