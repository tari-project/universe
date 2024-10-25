export function formatNumber(value: number, maxDigits = 3): string {
    //TODO: add props for customisation
    return Intl.NumberFormat(undefined, {
        notation: 'compact',
        maximumFractionDigits: maxDigits,
        style: 'decimal',
    }).format(value);
}
export function formatPercent(value = 0) {
    const p = Math.floor(value || 0).toLocaleString();
    return value > 0 ? `${p}%` : undefined;
}
