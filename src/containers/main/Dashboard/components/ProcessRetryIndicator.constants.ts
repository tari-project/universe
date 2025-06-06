// Technical status messages - these are system/debug messages not typically translated
export const TECHNICAL_MESSAGES = {
    PROCESS_STATUS: 'Process Status',
    BINARY_CORRUPTION_DETECTED: 'Binary corruption detected',
    REDOWNLOAD_INITIATED: 'Re-download initiated',
    ATTEMPT_TEMPLATE: (current: number, max: number) => `Attempt ${current} of ${max}`,
    RETRY_REASON_SEPARATOR: ' - ',
} as const;

export const STATUS_ICONS = {
    INFO: 'i',
    WARNING: '⚠',
    ERROR: '!',
    SUCCESS: '✓',
    EXPAND: '▼',
    COLLAPSE: '▲',
} as const;
