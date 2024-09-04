export function formatNumber(value: number, maxDigits?: number): string {
    //TODO: add props for customisation
    return Intl.NumberFormat(undefined, {
        notation: 'compact',
        maximumFractionDigits: maxDigits || 3,
        style: 'decimal',
    }).format(value);
}
