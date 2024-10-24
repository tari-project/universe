import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import ThemeSelector from '@app/containers/Settings/components/ThemeSelector.tsx';
import {
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/Settings/components/SettingsGroup.styles.ts';

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
