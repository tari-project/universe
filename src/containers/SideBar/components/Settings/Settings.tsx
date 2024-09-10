import { useState } from 'react';

import { IoSettingsOutline, IoClose } from 'react-icons/io5';

import VisualMode from '../../../Dashboard/components/VisualMode';
import { HorisontalBox, HeadingContainer } from './Settings.styles';

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
import HardwareStatus from '@app/containers/SideBar/components/Settings/HardwareStatus.tsx';

import DebugSettings from '@app/containers/SideBar/components/Settings/DebugSettings.tsx';
import { useTranslation } from 'react-i18next';

import { ResetSettingsButton } from '@app/containers/SideBar/components/Settings/ResetSettingsButton.tsx';
import MoneroAddressMarkup from './Markups/MoneroAddressMarkup';
import WalletAddressMarkup from './Markups/WalletAddressMarkup';
import CpuMiningMarkup from './Markups/CpuMiningMarkup';
import P2pMarkup from './Markups/P2pMarkup';
import GpuMiningMarkup from './Markups/GpuMiningMarkup';
import SeedWordsMarkup from './Markups/SeedWordsMarkup';

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
        <WalletAddressMarkup />
        <Divider />
        <P2pMarkup />
        <Divider />
        <DebugSettings />
        <Divider />
        <P2pMarkup />
        <Divider />
        <HardwareStatus />
        <Divider />
        <AppVersions />
        <Divider />
        <Stack direction="row" justifyContent="space-between">
            <VisualMode />
        </Stack>
    </Stack>
);

const tabs = [
    { label: 'General', content: <GeneralTab /> },
    { label: 'Experimental', content: <ExperimentalTab /> },
];

export default function Settings() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const [open, setOpen] = useState(false);

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
