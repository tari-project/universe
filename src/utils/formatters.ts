import { GpuMiningAlgorithm } from '@app/types/events-payloads';
import i18n from 'i18next';
import { TimeParts } from '@app/types/mining/schedule.ts';

export enum FormatPreset {
    PERCENT = 'percent',
    XTM_DECIMALS = 'xtm-decimals',
    XTM_COMPACT = 'xtm-compact',
    XTM_LONG = 'xtm-crypto',
    XTM_LONG_DEC = 'xtm-long',
    DECIMAL_COMPACT = 'decimal-compact',
    COMPACT = 'compact',
}

const removeDecimals = (value: number, decimals: number) => {
    return value / Math.pow(10, decimals);
};

const removeXTMCryptoDecimals = (value: number) => {
    return removeDecimals(value, 6);
};

/**
    ## Workaround for forced rounding up by Intl.NumberFormat
    ** 1234 => 0
    ** 1234567 => 1230000
    ** 123456789 => 123450000
    ** 12345678987654 => 12345678980000
*/
const roundToTwoDecimals = (val: number, decimals = 6) => {
    if (decimals <= 2) return val;
    return val - (val % Math.pow(10, decimals - 2));
};

/**
    ## Workaround for forced rounding up by Intl.NumberFormat
    ** 1234 => 0
    ** 1234567 => 1230000
    ** 123456789 => 123450000
    ** 12345678987654 => 12340000000000
*/
const roundCompactDecimals = (value: number, decimals = 6) => {
    if (value < Math.pow(10, decimals - 2)) return 0;
    if (value < Math.pow(10, decimals)) return roundToTwoDecimals(value, decimals);

    let unitIndex = 0;
    let formattedValue = value;
    while (formattedValue >= 1000) {
        formattedValue /= 1000;
        unitIndex++;
    }
    formattedValue = Math.floor(formattedValue * 100) / 100;
    return formattedValue * Math.pow(1000, unitIndex);
};

const SHARED_FORMAT_OPTIONS: Intl.NumberFormatOptions = {
    maximumFractionDigits: 2,
    notation: 'standard',
    style: 'decimal',
};
const formatValue = (value: number, options: Intl.NumberFormatOptions = {}): string =>
    Intl.NumberFormat(i18n.language, { ...SHARED_FORMAT_OPTIONS, ...options }).format(value);

const formatPercent = (value = 0) => formatValue(value, { style: 'percent' });

const formatXTMDecimals = (value: number) =>
    formatValue(removeXTMCryptoDecimals(value), {
        style: 'decimal',
        minimumFractionDigits: value > 0 ? 6 : undefined,
        maximumFractionDigits: undefined,
    });

const formatXTMCompact = (value: number) => {
    const strippedValue = removeXTMCryptoDecimals(roundCompactDecimals(value));
    const minimumFractionDigits = strippedValue > 1 && strippedValue % 1 === 0 ? 0 : 2;
    const options: Intl.NumberFormatOptions = {
        minimumFractionDigits,
        notation: 'compact',
    };
    return formatValue(strippedValue, options);
};

const formatXTMLong = (value: number) => formatValue(removeXTMCryptoDecimals(roundToTwoDecimals(value)));

const formatXTMLongDec = (value: number, maxFractionDigits = 4) =>
    formatValue(removeXTMCryptoDecimals(value), {
        maximumFractionDigits: maxFractionDigits,
        minimumFractionDigits: 2,
    });

const formatDecimalCompact = (value: number) => formatValue(value);

export function formatNumber(value: number, preset: FormatPreset): string {
    switch (preset) {
        case FormatPreset.COMPACT:
            if (value < 10000) {
                return formatDecimalCompact(value);
            }
            return formatValue(roundCompactDecimals(value), {
                notation: 'compact',
            });
        case FormatPreset.PERCENT:
            return formatPercent(value);
        case FormatPreset.XTM_COMPACT:
            if (value / 1_000_000 < 0.01 && value > 0) {
                return `< 0.01`;
            }
            return formatXTMCompact(value);
        case FormatPreset.XTM_LONG:
            return formatXTMLong(value);
        case FormatPreset.XTM_LONG_DEC: {
            return formatXTMLongDec(value);
        }
        case FormatPreset.XTM_DECIMALS:
            return formatXTMDecimals(value);
        case FormatPreset.DECIMAL_COMPACT:
            return formatDecimalCompact(value);
        default:
            console.error('Unknown format preset:', preset);
            return '-';
    }
}

interface Hashrate {
    value: number;
    unit: string;
}

export function formatHashrate(hashrate: number, joinUnit = true, algo = GpuMiningAlgorithm.SHA3X): Hashrate {
    const unit = algo === GpuMiningAlgorithm.SHA3X ? 'H' : 'G';
    const fixed = (val: number, dec = 2) => Number(val.toFixed(val >= 100 ? 1 : dec));
    if (hashrate < 1000) {
        return {
            value: fixed(hashrate, 1),
            unit: `${unit}/s`,
        };
    }
    if (hashrate < 1000000) {
        return {
            value: fixed(hashrate / 1000),
            unit: joinUnit ? ` k${unit}/s` : 'k',
        };
    }
    if (hashrate < 1000000000) {
        return {
            value: fixed(hashrate / 1000000),
            unit: joinUnit ? ` M${unit}/s` : 'M',
        };
    }
    if (hashrate < 1000000000000) {
        return {
            value: fixed(hashrate / 1000000000),
            unit: joinUnit ? ` G${unit}/s` : 'G',
        };
    }
    if (hashrate < 1000000000000000) {
        return {
            value: fixed(hashrate / 1000000000000),
            unit: joinUnit ? ` T${unit}/s` : 'T',
        };
    } else {
        return {
            value: fixed(hashrate / 1000000000000000),
            unit: joinUnit ? ` P${unit}/s` : 'P',
        };
    }
}

export const formatCountdown = (targetDate: string): string => {
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const difference = target - now;

    if (difference <= 0) {
        return '0D 0H 0M';
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}D ${hours}H ${minutes}M`;
};

export const fmtTimeUnit = (n: number): string => String(n).padStart(2, '0');
export const fmtTimePartString = (t: TimeParts): string =>
    `${fmtTimeUnit(t.hour)}:${fmtTimeUnit(t.minute)} ${t.timePeriod}`;

/**
 * Format amount with max 3 characters, no decimals if no space available
 */
export function formatAmountWithKM(value: number): string {
    if (value === 0) return '0';

    if (value < 1000) {
        if (value >= 100) return Math.round(value).toString(); // 3 digits, no decimals
        if (value >= 10) return value.toFixed(1); // 2 digits + 1 decimal = 3 chars
        return value.toFixed(2); // 1 digit + 2 decimals = 3 chars (0.XX)
    } else if (value < 1000000) {
        const kValue = value / 1000;
        if (kValue >= 100) return `${Math.round(kValue)}k`; // e.g., "123k" = 4 chars, but this is the minimum for 100k+
        if (kValue >= 10) return `${Math.round(kValue)}k`; // e.g., "12k" = 3 chars
        return `${kValue.toFixed(1)}k`; // e.g., "1.2k" = 4 chars, but this gives better precision
    } else {
        const mValue = value / 1000000;
        if (mValue >= 100) return `${Math.round(mValue)}m`;
        if (mValue >= 10) return `${Math.round(mValue)}m`;
        return `${mValue.toFixed(1)}m`;
    }
}

export { formatDecimalCompact, roundToTwoDecimals, removeDecimals, removeXTMCryptoDecimals, formatValue };
