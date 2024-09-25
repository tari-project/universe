import AirdropPermissionSettings from './sections/general/AirdropPermissionSettings.tsx';
import LogsSettings from './sections/general/LogsSettings.tsx';
import LanguageSettings from './sections/general/LanguageSettings.tsx';
import { ResetSettingsButton } from './sections/general/ResetSettingsButton.tsx';
import StartApplicationOnBootSettings from './sections/general/StartApplicationOnBootSettings.tsx';

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
