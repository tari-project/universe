import { useConfigCoreStore } from '@app/store';
import { updateShutdownMode } from '@app/store/actions/appConfigStoreActions';
import { useTranslation } from 'react-i18next';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles';
import { Typography } from '@app/components/elements/Typography';
import { ToggleSwitch } from '@app/components/elements/inputs/switch/ToggleSwitch';
import { ShutdownMode } from '@app/types/configs';

export const TaskTrayModeSettings = () => {
    const { t } = useTranslation('settings', { useSuspense: false });
    const shutdownModeState = useConfigCoreStore((s) => s.shutdown_mode);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const enabled = e.target.checked;
        updateShutdownMode(enabled ? ShutdownMode.Tasktray : ShutdownMode.Direct);
    };

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('task-tray.title')}</Typography>
                    </SettingsGroupTitle>
                    <Typography>{t('task-tray.description')}</Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <ToggleSwitch checked={shutdownModeState === ShutdownMode.Tasktray} onChange={onChange} />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
};
