import AirdropPermissionSettings from './AirdropPermissionSettings.tsx';
import LogsSettings from './LogsSettings.tsx';
import LanguageSettings from './LanguageSettings.tsx';
import { ResetSettingsButton } from './ResetSettingsButton.tsx';
import StartApplicationOnBootSettings from './StartApplicationOnBootSettings.tsx';

export const GeneralSettings = () => {
    return (
        <>
            <StartApplicationOnBootSettings />
            <LanguageSettings />
            <LogsSettings />
            <AirdropPermissionSettings />
            <ResetSettingsButton />
        </>
    );
};
