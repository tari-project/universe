export function formatNumber(value: number, maxDigits?: number): string {
    //TODO: add props for customisation
    return Intl.NumberFormat(undefined, {
        notation: 'compact',
        maximumFractionDigits: maxDigits || 2,
        compactDisplay: 'short',
        useGrouping: true,
    }).format(value);
}
export function formatPercent(value = 0) {
    const p = Math.floor(value || 0).toLocaleString();
    return value > 0 ? `${p}%` : undefined;
}
