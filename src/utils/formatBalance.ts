import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { formatNumber } from '@app/utils/formatNumber.ts';
import { useCallback } from 'react';

export default function formatBalance(value: number, locale: string, maxDigitsArg?: number) {
    const balance = value / 1_000_000;
    const maxDigits = balance > 1_000_000 ? 2 : balance < 10 ? 3 : 1;
    return formatNumber(balance, maxDigitsArg || maxDigits, locale);
}

export const useFormatBalance = (value: number, maxDigitsArg?: number) => {
    const locale = useAppConfigStore((s) => s.application_language);
    const handler = useCallback(
        () => formatBalance(value, locale || 'en-US', maxDigitsArg),
        [locale, maxDigitsArg, value]
    );

    return handler();
};
