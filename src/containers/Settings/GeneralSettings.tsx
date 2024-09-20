import LanguageDropdown from '@app/containers/SideBar/components/Settings/components/LanguageDropdown.tsx';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
} from '@app/containers/Settings/components/SettingsGroup.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { ButtonBase } from '@app/components/elements/buttons/ButtonBase';

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
            <SettingsGroup>
                <SettingsGroupTitle>
                    <Typography variant="h6">{t('logs')}</Typography>
                </SettingsGroupTitle>
                <SettingsGroupContent>
                    <div />
                    <SettingsGroupAction>
                        <ButtonBase>{t('open-logs-directory')}</ButtonBase>
                    </SettingsGroupAction>
                </SettingsGroupContent>
            </SettingsGroup>
        </>
    );
};
