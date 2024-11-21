import ThemeSettings from './ThemeSettings';
import AirdropPermissionSettings from './AirdropPermissionSettings.tsx';
import LogsSettings from './LogsSettings.tsx';
import LanguageSettings from './LanguageSettings.tsx';
import { ResetSettingsButton } from './ResetSettingsButton.tsx';
import StartApplicationOnBootSettings from './StartApplicationOnBootSettings.tsx';
import AutoUpdate from './AutoUpdate.tsx';

export const GeneralSettings = () => {
    return (
        <>
            <StartApplicationOnBootSettings />
            <AutoUpdate />
            <LanguageSettings />
            <ThemeSettings />
            <LogsSettings />
            <AirdropPermissionSettings />
            <ResetSettingsButton />
        </>
    );
};
