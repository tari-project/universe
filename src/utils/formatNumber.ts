const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte', 'petabyte'];

const getValueAndUnit = (n: number) => {
    const i = n == 0 ? 0 : Math.floor(Math.log(n) / Math.log(1024)); // check unit
    const bytes = n / Math.pow(1000, i); // remove to adjust unit
    return { bytes, unit: UNITS[i] };
};

export function formatHashrate(value: number, maxDigits = 3, locales?: string, byteSymbol?: string): string {
    const { unit, bytes } = getValueAndUnit(value);
    return new Intl.NumberFormat(locales, {
        notation: 'compact',
        maximumFractionDigits: maxDigits,
        style: 'unit',
        unit: `${unit}`,
        unitDisplay: 'narrow',
    })
        .format(bytes)
        .replace(byteSymbol ?? '', ''); // remove byte symbol because it's not needed
}

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
