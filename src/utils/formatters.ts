import { AwardedTimeBonus } from '@app/types/sosTypes';
import i18n from 'i18next';

export enum FormatPreset {
    PERCENT = 'percent',
    TXTM_COMPACT = 'txtm-compact',
    TXTM_LONG = 'txtm-crypto',
    DECIMAL_COMPACT = 'decimal-compact',
}

const removeDecimals = (value: number, decimals: number) => {
    return value / Math.pow(10, decimals);
};

const removeTXTMCryptoDecimals = (value: number) => {
    return removeDecimals(value, 6);
};

const formatValue = (value: number, options: Intl.NumberFormatOptions = {}): string =>
    Intl.NumberFormat(i18n.language, options).format(value);

const formatPercent = (value = 0) => formatValue(value, { style: 'percent', maximumFractionDigits: 2 });

const formatTXTMCompact = (value: number) =>
    formatValue(removeTXTMCryptoDecimals(value), {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        notation: 'compact',
        style: 'decimal',
    });

const formatTXTMLong = (value: number) =>
    formatValue(removeTXTMCryptoDecimals(value), { maximumFractionDigits: 2, notation: 'standard', style: 'decimal' });

const formatDecimalCompact = (value: number) => formatValue(value, { maximumFractionDigits: 2, style: 'decimal' });

export function formatNumber(value: number, preset: FormatPreset): string {
    switch (preset) {
        case FormatPreset.PERCENT:
            return formatPercent(value);
        case FormatPreset.TXTM_COMPACT:
            return formatTXTMCompact(value);
        case FormatPreset.TXTM_LONG:
            return formatTXTMLong(value);
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

export const sosFormatAwardedBonusTime = (props: AwardedTimeBonus) => {
    const units: string[] = [];
    if (props.days) units.push(`${props.days}d`);
    if (props.hours) units.push(`${props.hours}h`);
    if (props.minutes) units.push(`${props.minutes}m`);
    if (props.seconds) units.push(`${props.seconds}s`);
    if (units.length === 0) units.push('0s');
    return units.join(' ');
};
