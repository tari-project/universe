import { Typography } from '@app/components/elements/Typography.tsx';
import { ToggleSwitch } from '@app/components/elements/inputs/switch/ToggleSwitch';
import { setShowWindowOnStartup, useConfigUIStore } from '@app/store';
import { useTranslation } from 'react-i18next';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles';

export default function ShowWindowOnStartupSettings() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const showWindowOnStartup = useConfigUIStore((s) => s.show_window_on_startup) ?? true;

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('show-window-on-startup.title')}</Typography>
                    </SettingsGroupTitle>
                    <Typography variant="p">{t('show-window-on-startup.description')}</Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <ToggleSwitch
                        data-testid="settings-toggle-show-window-on-startup"
                        checked={showWindowOnStartup}
                        onChange={(event) => setShowWindowOnStartup(event.target.checked)}
                    />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
