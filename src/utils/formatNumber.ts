export function formatNumber(value: number): string {
    //TODO: add props for customisation
    return Intl.NumberFormat(undefined, {
        notation: 'compact',
        maximumFractionDigits: 3,
        style: 'decimal',
    }).format(value);
}
