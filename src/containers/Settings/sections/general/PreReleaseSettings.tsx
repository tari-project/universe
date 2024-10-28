import { useTranslation } from 'react-i18next';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { useCallback } from 'react';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/Settings/components/SettingsGroup.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';

export default function PreReleaseSettings() {
    const isPreRelease = useAppConfigStore((s) => s.pre_release);
    const setPreRelease = useAppConfigStore((s) => s.setPreRelease);
    const { t } = useTranslation('settings', { useSuspense: false });

    const handleChange = useCallback(async () => {
        await setPreRelease(!isPreRelease);
    }, [isPreRelease, setPreRelease]);

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('pre-release.title')}</Typography>
                    </SettingsGroupTitle>
                    <Typography>{t('pre-release.subtitle')}</Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <ToggleSwitch checked={isPreRelease} onChange={handleChange} />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
