import React, { useCallback, useState } from 'react';
import { useAppStateStore } from '@app/store/appStateStore.ts';

import { Typography } from '@app/components/elements/Typography.tsx';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';

import { useTranslation } from 'react-i18next';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/Settings/components/SettingsGroup.styles.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { ButtonBase } from '@app/components/elements/buttons/ButtonBase.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { invoke } from '@tauri-apps/api/tauri';

const P2pMarkup = () => {
    const [showRestartModal, setShowRestartModal] = useState(false);
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const isP2poolEnabled = useAppConfigStore((state) => state.p2pool_enabled);
    const setP2poolEnabled = useAppConfigStore((state) => state.setP2poolEnabled);
    const miningAllowed = useAppStateStore((s) => s.setupProgress >= 1);
    const isDisabled = !miningAllowed;

    const handleP2poolEnabled = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            await setP2poolEnabled(event.target.checked);
            setShowRestartModal((c) => !c);
        },
        [setP2poolEnabled]
    );

    const handleRestart = useCallback(async () => {
        try {
            console.info('Restarting application.');
            await invoke('restart_application');
        } catch (error) {
            console.error('Restart error: ', error);
        }
    }, []);

    return (
        <Dialog open={showRestartModal} onOpenChange={setShowRestartModal}>
            <SettingsGroupWrapper>
                <SettingsGroup>
                    <SettingsGroupContent>
                        <SettingsGroupTitle>
                            <Typography variant="h6">
                                {t('pool-mining', { ns: 'settings' })}
                                <b>&nbsp;(APP RESTART REQUIRED)</b>
                            </Typography>
                        </SettingsGroupTitle>
                        <Typography>{t('pool-mining-description', { ns: 'settings' })}</Typography>
                    </SettingsGroupContent>
                    <SettingsGroupAction>
                        <ToggleSwitch checked={isP2poolEnabled} disabled={isDisabled} onChange={handleP2poolEnabled} />
                    </SettingsGroupAction>
                </SettingsGroup>
            </SettingsGroupWrapper>
            <DialogContent>
                {/*TODO: move to own component*/}
                <Stack direction="column" alignItems="center" justifyContent="space-between" style={{ height: 120 }}>
                    <Stack>
                        <Typography variant="h3">Restart Tari Universe?</Typography>
                        <Typography variant="p">An app restart is required for changes to take effect.</Typography>
                    </Stack>

                    <Stack direction="row" gap={8}>
                        <ButtonBase size="small" onClick={() => setShowRestartModal(false)}>
                            Cancel
                        </ButtonBase>
                        <ButtonBase size="small" variant="outlined" onClick={handleRestart}>
                            Restart Now
                        </ButtonBase>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default P2pMarkup;
