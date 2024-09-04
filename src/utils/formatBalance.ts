import { formatNumber } from '@app/utils/formatNumber.ts';

export default function formatBalance(value: number) {
    const balance = value / 1_000_000;
    const maxDigits = balance > 1_000_000 ? 2 : 3;
    return formatNumber(balance, maxDigits);
}
