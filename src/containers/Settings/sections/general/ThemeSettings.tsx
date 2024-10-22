import {
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/Settings/components/SettingsGroup.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';

import { useTranslation } from 'react-i18next';
import ThemeSelector from '@app/containers/Settings/components/ThemeSelector.tsx';

export default function ThemeSettings() {
    const { t } = useTranslation('settings', { useSuspense: false });
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
