import React from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import LanguageDropdown from '../../components/LanguageDropdown.tsx';
import {
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';

export default function LanguageSettings() {
    const { t } = useTranslation('settings', { useSuspense: false });
    const { setShouldAlwaysUseSystemLanguage, shouldAlwaysUseSystemLanguage } = useAppConfigStore((s) => ({
        shouldAlwaysUseSystemLanguage: s.should_always_use_system_language,
        setShouldAlwaysUseSystemLanguage: s.setShouldAlwaysUseSystemLanguage,
    }));

    return (
        <React.Fragment>
            <SettingsGroupWrapper>
                <SettingsGroupTitle>
                    <Typography variant="h6">{t('change-language')}</Typography>
                </SettingsGroupTitle>
                <SettingsGroupContent>
                    <LanguageDropdown />
                </SettingsGroupContent>
            </SettingsGroupWrapper>
            <SettingsGroupWrapper>
                <SettingsGroupTitle>
                    <Typography variant="h6">{t('should-use-system-language')}</Typography>
                </SettingsGroupTitle>
                <SettingsGroupContent>
                    <ToggleSwitch
                        checked={shouldAlwaysUseSystemLanguage}
                        onChange={(event) => setShouldAlwaysUseSystemLanguage(event.target.checked)}
                    />
                </SettingsGroupContent>
            </SettingsGroupWrapper>
        </React.Fragment>
    );
}
