import AirdropPermissionSettings from './sections/general/AirdropPermissionSettings.tsx';
import LogsSettings from './sections/general/LogsSettings.tsx';
import LanguageSettings from './sections/general/LanguageSettings.tsx';
import { ResetSettingsButton } from './sections/general/ResetSettingsButton.tsx';

export const GeneralSettings = () => {
    return (
        <>
            <LanguageSettings />
            <LogsSettings />
            <AirdropPermissionSettings />
            <ResetSettingsButton />
        </>
    );
};
