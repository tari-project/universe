import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';

import LanguageDropdown from '@app/containers/SideBar/components/Settings/components/LanguageDropdown.tsx';
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
