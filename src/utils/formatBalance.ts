import { formatNumber } from '@app/utils/formatNumber.ts';

export default function formatBalance(value: number) {
    const balance = value / 1_000_000;
    return formatNumber(balance, 2);
}
