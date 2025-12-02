import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { ToggleSwitch } from '@app/components/elements/inputs/switch/ToggleSwitch';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles';
import { useConfigMiningStore } from '@app/store';
import { PauseOnBatteryModeState } from '@app/types/configs';
import { setPauseOnBatteryMode } from '@app/store/actions/appConfigStoreActions';

export default function PauseOnBatteryModeMarkup() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const pauseOnBatteryMode = useConfigMiningStore((s) => s.pause_on_battery_mode);

    if (pauseOnBatteryMode === PauseOnBatteryModeState.NotSupported) {
        return null;
    }

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('pause-on-battery-mode.title')}</Typography>
                    </SettingsGroupTitle>
                    <Typography variant="p">{t('pause-on-battery-mode.description')}</Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <ToggleSwitch
                        checked={pauseOnBatteryMode === PauseOnBatteryModeState.Enabled}
                        onChange={(event) =>
                            setPauseOnBatteryMode(
                                event.target.checked
                                    ? PauseOnBatteryModeState.Enabled
                                    : PauseOnBatteryModeState.Disabled
                            )
                        }
                    />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
