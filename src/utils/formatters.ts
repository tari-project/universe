import i18n from 'i18next';

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

const formatValue = (value: number, options: Intl.NumberFormatOptions = {}): string =>
    Intl.NumberFormat(i18n.language, options).format(value);

const formatPercent = (value = 0) => formatValue(value, { style: 'percent', maximumFractionDigits: 2 });

const formatXTMDecimals = (value: number) =>
    formatValue(removeXTMCryptoDecimals(value), {
        style: 'decimal',
        minimumFractionDigits: 6,
    });

const formatXTMCompact = (value: number) =>
    formatValue(removeXTMCryptoDecimals(roundCompactDecimals(value)), {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        notation: 'compact',
        style: 'decimal',
    });

const formatXTMLong = (value: number) =>
    formatValue(removeXTMCryptoDecimals(roundToTwoDecimals(value)), {
        maximumFractionDigits: 2,
        notation: 'standard',
        style: 'decimal',
    });

const formatXTMLongDec = (value: number) =>
    formatValue(removeXTMCryptoDecimals(value), {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
        notation: 'standard',
        style: 'decimal',
    });

const formatDecimalCompact = (value: number) => formatValue(value, { maximumFractionDigits: 2, style: 'decimal' });

export function formatNumber(value: number, preset: FormatPreset): string {
    switch (preset) {
        case FormatPreset.COMPACT:
            if (value < 10000) {
                return formatDecimalCompact(value);
            }
            return formatValue(roundCompactDecimals(value), {
                maximumFractionDigits: 2,
                notation: 'compact',
                style: 'decimal',
            });
        case FormatPreset.PERCENT:
            return formatPercent(value);
        case FormatPreset.XTM_COMPACT:
            return formatXTMCompact(value);
        case FormatPreset.XTM_LONG:
            return formatXTMLong(value);
        case FormatPreset.XTM_LONG_DEC:
            return formatXTMLongDec(value);
        case FormatPreset.XTM_DECIMALS:
            return formatXTMDecimals(value);
        case FormatPreset.DECIMAL_COMPACT:
            return formatDecimalCompact(value);
        default:
            console.error('Unknown format preset:', preset);
            return '-';
    }
}

export function formatHashrate(hashrate: number, joinUnit = true): string {
    if (hashrate < 1000) {
        return joinUnit ? hashrate + ' H/s' : hashrate.toFixed(2);
    } else if (hashrate < 1000000) {
        return (hashrate / 1000).toFixed(2) + (joinUnit ? ' kH/s' : 'k');
    } else if (hashrate < 1000000000) {
        return (hashrate / 1000000).toFixed(2) + (joinUnit ? ' MH/s' : 'M');
    } else if (hashrate < 1000000000000) {
        return (hashrate / 1000000000).toFixed(2) + (joinUnit ? ' GH/s' : 'G');
    } else if (hashrate < 1000000000000000) {
        return (hashrate / 1000000000000).toFixed(2) + (joinUnit ? ' TH/s' : 'T');
    } else {
        return (hashrate / 1000000000000000).toFixed(2) + (joinUnit ? ' PH/s' : 'P');
    }
}

export { formatDecimalCompact, roundToTwoDecimals, removeDecimals };
