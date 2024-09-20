import LanguageDropdown from '@app/containers/SideBar/components/Settings/components/LanguageDropdown.tsx';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
} from '@app/containers/Settings/components/SettingsGroup.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';

import AirdropPermissionSettings from '@app/containers/Airdrop/AirdropPermissionSettings/AirdropPermissionSettings.tsx';
import LogsSettings from '@app/containers/SideBar/components/Settings/LogsSettings.tsx';

export const GeneralSettings = () => {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    return (
        <>
            <SettingsGroup>
                <SettingsGroupTitle>
                    <Typography variant="h6">{t('change-language')}</Typography>
                </SettingsGroupTitle>
                <SettingsGroupContent>
                    <LanguageDropdown />
                </SettingsGroupContent>
            </SettingsGroup>
            <LogsSettings />
            <AirdropPermissionSettings />
        </>
    );
};
