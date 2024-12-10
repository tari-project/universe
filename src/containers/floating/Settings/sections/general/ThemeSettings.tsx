import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { useTranslation } from 'react-i18next';

import { Typography } from '@app/components/elements/Typography.tsx';
import ThemeSelector from '../../components/ThemeSelector';

import {
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';

export default function ThemeSettings() {
    const { t } = useTranslation('settings', { useSuspense: false });
    const reset_earnings = useAppConfigStore((s) => s.reset_earnings);
    const isEsme = useAppConfigStore((s) => s.config_file?.includes('alpha'));

    if (!reset_earnings || !isEsme) {
        return null;
    }
    return (
        <SettingsGroupWrapper>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('theme')}</Typography>
            </SettingsGroupTitle>
            <SettingsGroupContent>
                <ThemeSelector />
            </SettingsGroupContent>
        </SettingsGroupWrapper>
    );
}
