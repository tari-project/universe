import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import LanguageDropdown from '../../components/LanguageDropdown.tsx';
import {
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/Settings/components/SettingsGroup.styles.ts';

export default function LanguageSettings() {
    const { t } = useTranslation(['settings'], { useSuspense: false });

    return (
        <SettingsGroupWrapper>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('change-language')}</Typography>
            </SettingsGroupTitle>
            <SettingsGroupContent>
                <LanguageDropdown />
            </SettingsGroupContent>
        </SettingsGroupWrapper>
    );
}
