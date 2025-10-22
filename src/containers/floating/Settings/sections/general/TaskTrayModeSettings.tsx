import { useConfigCoreStore } from '@app/store';
import { toggleTaskTrayMode } from '@app/store/actions/appConfigStoreActions';
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

export const TaskTrayModeSettings = () => {
    const { t } = useTranslation('settings', { useSuspense: false });
    const taskTrayModeState = useConfigCoreStore((s) => s.tasktray_mode);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const enabled = e.target.checked;
        toggleTaskTrayMode(enabled);
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
                    <ToggleSwitch checked={taskTrayModeState} onChange={onChange} />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
};
