export function formatNumber(value: number): string {
    if (value < 0) {
        return value.toPrecision(1);
    } else if (value >= 1_000_000) {
        return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'm';
    } else if (value >= 1_000) {
        return (value / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    } else {
        return value.toString();
    }
}
