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
import AudioSettings from './AudioSettings.tsx';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';

export const GeneralSettings = () => {
    const isAudioFeatureEnabled = useAppConfigStore.getState().isAudioFeatureEnabled;
    return (
        <>
            <StartApplicationOnBootSettings />
            <AutoUpdate />
            <PreReleaseSettings />
            <AirdropPermissionSettings />
            <LanguageSettings />
            <VisualMode />
            {isAudioFeatureEnabled ? <AudioSettings /> : null}
            <ThemeSettings />
            <LogsSettings />
            <SettingsGroupWrapper $advanced>
                <AppDataSettings />
                <ResetSettingsButton />
            </SettingsGroupWrapper>
        </>
    );
};
