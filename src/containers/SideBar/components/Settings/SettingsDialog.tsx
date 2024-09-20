import { useMemo } from 'react';

import { IoClose } from 'react-icons/io5';

import VisualMode from '../../../Dashboard/components/VisualMode';

import { IconButton } from '@app/components/elements/Button.tsx';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Divider } from '@app/components/elements/Divider.tsx';
import { SettingsTabs } from '@app/components/elements/Tabs';

import { useTranslation } from 'react-i18next';

import { useUIStore } from '@app/store/useUIStore';
import { ToggleAirdropUi } from '@app/containers/Airdrop/Settings/ToggleAirdropUi';
import { useAppStateStore } from '@app/store/appStateStore';

const GeneralTab = () => (
    <Stack gap={10}>
        <Divider />
        <Divider />
        <Divider />
        <Divider />
        <Divider />
        <Divider />
    </Stack>
);

const ExperimentalTab = () => {
    const showExperimental = useUIStore((s) => s.showExperimental);

    return (
        <Stack gap={10}>
            {showExperimental && (
                <>
                    <Divider />

                    <Divider />
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                        <VisualMode />
                        <ToggleAirdropUi />
                    </Stack>
                </>
            )}
        </Stack>
    );
};

export default function SettingsDialog() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const isSettingsOpen = useAppStateStore((s) => s.isSettingsOpen);
    const setIsSettingsOpen = useAppStateStore((s) => s.setIsSettingsOpen);

    const tabs = useMemo(
        () => [
            { label: t('tabs.general', { ns: 'settings' }), content: <GeneralTab /> },
            { label: t('tabs.experimental', { ns: 'settings' }), content: <ExperimentalTab /> },
        ],
        [t]
    );

    return (
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogContent>
                <SettingsTabs tabs={tabs} />
            </DialogContent>
        </Dialog>
    );
}
