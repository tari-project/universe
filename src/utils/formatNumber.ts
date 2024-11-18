export function formatNumber(value: number, maxDigits = 3, locale?: string): string {
    const valFloor = Math.floor(value);
    return Intl.NumberFormat(locale, {
        notation: 'compact',
        maximumFractionDigits: maxDigits,
        style: 'decimal',
    }).format(valFloor);
}
export function formatPercent(value = 0) {
    const p = Math.floor(value || 0).toLocaleString();
    return value > 0 ? `${p}%` : undefined;
}
