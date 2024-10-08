import { formatNumber } from '@app/utils/formatNumber.ts';

export default function formatBalance(value: number, maxDigitsArg = 3) {
    const balance = value / 1_000_000;
    const maxDigits = balance > 1_000_000 ? 2 : 1;
    return formatNumber(balance, maxDigitsArg || maxDigits);
}
