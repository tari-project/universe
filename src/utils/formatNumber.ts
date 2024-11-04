export function formatNumber(value: number, maxDigits = 3, locale?: string): string {
    //TODO: add props for customisation
    return Intl.NumberFormat(locale, {
        notation: 'compact',
        maximumFractionDigits: maxDigits,
        style: 'decimal',
    }).format(value);
}
export function formatPercent(value = 0) {
    const p = Math.floor(value || 0).toLocaleString();
    return value > 0 ? `${p}%` : undefined;
}
