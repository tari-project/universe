import { SettingsGroupWrapper } from '@app/containers/floating/Settings/components/SettingsGroup.styles';
import AppDataSettings from './AppDataSettings';
import ThemeSettings from './ThemeSettings';
import AirdropPermissionSettings from './AirdropPermissionSettings.tsx';
import LogsSettings from './LogsSettings.tsx';
import LanguageSettings from './LanguageSettings.tsx';
import { ResetSettingsButton } from './ResetSettingsButton.tsx';
import StartApplicationOnBootSettings from './StartApplicationOnBootSettings.tsx';
import AutoUpdate from './AutoUpdate.tsx';
import PreReleaseSettings from './PreReleaseSettings.tsx';
import VisualMode from '@app/containers/main/Dashboard/components/VisualMode.tsx';

import AirdropNotificationsSettings from './AirdropNotificationSettings.tsx';
import { TaskTrayModeSettings } from './TaskTrayModeSettings.tsx';
import NodeDataLocationSettings from './NodeDataLocation.tsx';

export const GeneralSettings = () => {
    return (
        <>
            <NodeDataLocationSettings />
            <StartApplicationOnBootSettings />
            <AutoUpdate />
            <PreReleaseSettings />
            <TaskTrayModeSettings />
            <AirdropPermissionSettings />
            <AirdropNotificationsSettings />
            <LanguageSettings />
            <ThemeSettings />
            <VisualMode />
            <LogsSettings />
            <SettingsGroupWrapper $advanced>
                <AppDataSettings />
                <ResetSettingsButton />
            </SettingsGroupWrapper>
        </>
    );
};
