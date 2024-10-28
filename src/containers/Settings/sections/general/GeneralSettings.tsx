import AirdropPermissionSettings from './AirdropPermissionSettings.tsx';
import LogsSettings from './LogsSettings.tsx';
import LanguageSettings from './LanguageSettings.tsx';
import { ResetSettingsButton } from './ResetSettingsButton.tsx';
import StartApplicationOnBootSettings from './StartApplicationOnBootSettings.tsx';
import AutoUpdate from './AutoUpdate.tsx';
import PreReleaseSettings from './PreReleaseSettings.tsx';

export const GeneralSettings = () => {
    return (
        <>
            <StartApplicationOnBootSettings />
            <AutoUpdate />
            <LanguageSettings />
            <LogsSettings />
            <AirdropPermissionSettings />
            <PreReleaseSettings />
            <ResetSettingsButton />
        </>
    );
};
