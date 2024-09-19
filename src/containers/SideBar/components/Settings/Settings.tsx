import { useState } from 'react';

import { IoClose, IoSettingsOutline } from 'react-icons/io5';

import VisualMode from '../../../Dashboard/components/VisualMode';
import { HeadingContainer, HorisontalBox } from './Settings.styles';

import AirdropPermissionSettings from '@app/containers/Airdrop/AirdropPermissionSettings/AirdropPermissionSettings.tsx';
import LogsSettings from './LogsSettings';

import { IconButton } from '@app/components/elements/Button.tsx';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Divider } from '@app/components/elements/Divider.tsx';
import { SettingsTabs } from '@app/components/elements/Tabs';

import AppVersions from '@app/containers/SideBar/components/Settings/AppVersions.tsx';
import LanguageSettings from '@app/containers/SideBar/components/Settings/LanguageSettings.tsx';

import DebugSettings from '@app/containers/SideBar/components/Settings/DebugSettings.tsx';
import { useTranslation } from 'react-i18next';

import { ResetSettingsButton } from '@app/containers/SideBar/components/Settings/ResetSettingsButton.tsx';
import MoneroAddressMarkup from './Markups/MoneroAddressMarkup';
import WalletAddressMarkup from './Markups/WalletAddressMarkup';
import CpuMiningMarkup from './Markups/CpuMiningMarkup';
import P2pMarkup from './Markups/P2pMarkup';
import P2poolStatsMarkup from './Markups/P2poolStatsMarkup';
import GpuMiningMarkup from './Markups/GpuMiningMarkup';
import SeedWordsMarkup from './Markups/SeedWordsMarkup';
import ExperimentalWarning from './ExperimentalWarning';
import { useUIStore } from '@app/store/useUIStore';
import { ToggleAirdropUi } from '@app/containers/Airdrop/Settings/ToggleAirdropUi';

export default function Settings() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const [open, setOpen] = useState(false);
    const showExperimental = useUIStore((s) => s.showExperimental);

    const GeneralTab = () => (
        <Stack gap={10}>
            <MoneroAddressMarkup />
            <Divider />
            <SeedWordsMarkup />
            <Divider />
            <HorisontalBox>
                <CpuMiningMarkup />
                <GpuMiningMarkup />
            </HorisontalBox>
            <Divider />
            <LogsSettings />
            <Divider />
            <LanguageSettings />
            <Divider />
            <AirdropPermissionSettings />
            <Divider />
            <HorisontalBox>
                <ResetSettingsButton />
            </HorisontalBox>
        </Stack>
    );

    const ExperimentalTab = () => (
        <Stack gap={10}>
            <ExperimentalWarning />
            {showExperimental && (
                <>
                    <Divider />
                    <WalletAddressMarkup />
                    <Divider />
                    <P2pMarkup />
                    <P2poolStatsMarkup />
                    <Divider />
                    <DebugSettings />
                    <Divider />
                    <AppVersions />
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                        <VisualMode />
                        <ToggleAirdropUi />
                    </Stack>
                </>
            )}
        </Stack>
    );

    const tabs = [
        { label: t('tabs.general', { ns: 'settings' }), content: <GeneralTab /> },
        { label: t('tabs.experimental', { ns: 'settings' }), content: <ExperimentalTab /> },
    ];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <IconButton onClick={() => setOpen(true)}>
                <IoSettingsOutline size={16} />
            </IconButton>
            <DialogContent>
                <HeadingContainer>
                    <Typography variant="h4">{t('settings', { ns: 'settings' })}</Typography>
                    <IconButton onClick={() => setOpen(false)}>
                        <IoClose />
                    </IconButton>
                </HeadingContainer>
                <SettingsTabs tabs={tabs} />
            </DialogContent>
        </Dialog>
    );
}
