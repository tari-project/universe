import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { formatNumber } from '@app/utils/formatNumber';

export const useFormatNumber = () => {
    const locale = useAppConfigStore((s) => s.application_language);
    return (value: number, maxDigits = 3) => formatNumber(value, maxDigits, locale || 'en-US');
};
