export function formatNumber(value: number, maxDigits = 3, isHashrate = true): string {
    //TODO: add props for customisation
    const formatted = Intl.NumberFormat(undefined, {
        notation: 'compact',
        maximumFractionDigits: maxDigits,
        style: 'decimal',
    }).format(value);
    // workaround because there is no "hashrate" unit
    return isHashrate ? formatted.replace('B', 'G') : formatted;
}
export function formatPercent(value = 0) {
    const p = Math.floor(value || 0).toLocaleString();
    return value > 0 ? `${p}%` : undefined;
}
