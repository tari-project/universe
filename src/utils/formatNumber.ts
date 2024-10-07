export function formatNumber(value: number, maxDigits?: number): string {
    return Intl.NumberFormat(undefined, {
        notation: 'compact',
        maximumFractionDigits: maxDigits || 3,
        style: 'decimal',
    }).format(value);
}
export function formatPercent(value = 0) {
    const p = Math.floor(value || 0).toLocaleString();
    return value > 0 ? `${p}%` : undefined;
}
