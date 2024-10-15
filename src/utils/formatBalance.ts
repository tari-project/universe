import { formatNumber } from '@app/utils/formatNumber.ts';

export default function formatBalance(value: number, maxDigitsArg?: number) {
    const balance = value / 1_000_000;
    const maxDigits = balance > 1_000_000 ? 2 : balance < 10 ? 3 : 1;
    return formatNumber(balance, maxDigitsArg || maxDigits);
}
