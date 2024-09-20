import AirdropPermissionSettings from '@app/containers/Airdrop/AirdropPermissionSettings/AirdropPermissionSettings.tsx';
import LogsSettings from '@app/containers/SideBar/components/Settings/LogsSettings.tsx';
import LanguageSettings from '@app/containers/SideBar/components/Settings/LanguageSettings.tsx';
import { ResetSettingsButton } from '@app/containers/SideBar/components/Settings/ResetSettingsButton.tsx';

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
