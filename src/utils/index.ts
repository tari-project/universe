export * from './calculateTimeSince.ts';
export * from './convertHex.ts';
export * from './formatters.ts';
export * from './shared-logger.ts';
export * from './truncateString.ts';

export const defaultHeaders = {
    'X-Requested-With': `TariUniverse/${import.meta.env.VITE_TARI_UNIVERSE_VERSION || 'unknown'}`,
};
