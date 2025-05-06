import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles';
import { setShouldAutoLaunch, useConfigCoreStore } from '@app/store';

export default function StartApplicationOnBootSettings() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const shouldAutoLaunch = useConfigCoreStore((s) => s.should_auto_launch);

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('should-auto-start.title')}</Typography>
                    </SettingsGroupTitle>
                    <Typography variant="p">{t('should-auto-start.description')}</Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <ToggleSwitch
                        checked={shouldAutoLaunch}
                        onChange={(event) => setShouldAutoLaunch(event.target.checked)}
                    />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
