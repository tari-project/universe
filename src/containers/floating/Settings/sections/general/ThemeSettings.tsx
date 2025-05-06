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
