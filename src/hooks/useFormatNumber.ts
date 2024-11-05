import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { formatNumber } from '@app/utils/formatNumber';

export const useFormatNumber = () => {
    const locale = useAppConfigStore((s) => s.application_language);
    const systemLang = useAppConfigStore((s) => s.should_always_use_system_language);

    return (value: number, maxDigits = 3) => formatNumber(value, maxDigits, systemLang ? undefined : locale);
};
