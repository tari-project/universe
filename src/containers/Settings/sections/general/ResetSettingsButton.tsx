import { useAppStateStore } from '@app/store/appStateStore';

import { invoke } from '@tauri-apps/api';
import { useCallback, useState } from 'react';

import { Typography } from '@app/components/elements/Typography.tsx';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { useTranslation } from 'react-i18next';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/Settings/components/SettingsGroup.styles.ts';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { SquaredButton } from '@app/components/elements/buttons/SquaredButton.tsx';

export const ResetSettingsButton = () => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const setError = useAppStateStore((state) => state.setError);
    const [resetWallet, setResetWallet] = useState(false);
    const { t } = useTranslation('settings', { useSuspense: false });

    const resetSettings = () => {
        setLoading(true);
        invoke('reset_settings', { resetWallet })
            .then(() => {
                setLoading(false);
                setOpen(false);
            })
            .catch((e) => {
                console.error('Error when resetting settings: ', e);
                setError('Resetting settings failed: ' + e);
                setLoading(false);
                setOpen(false);
            });
    };

    const handleClose = useCallback(() => {
        setOpen(false);
    }, [setOpen]);

    return (
        <Dialog open={open} onOpenChange={setOpen} disableClose={loading}>
            <SettingsGroupWrapper>
                <SettingsGroup>
                    <SettingsGroupContent>
                        <SettingsGroupTitle>
                            <Typography variant="h6">{t('reset-settings')}</Typography>
                        </SettingsGroupTitle>
                    </SettingsGroupContent>
                    <SettingsGroupAction>
                        <Button onClick={() => setOpen(true)}>{t('reset-settings')}</Button>
                    </SettingsGroupAction>
                </SettingsGroup>
            </SettingsGroupWrapper>
            <DialogContent>
                <Stack direction="column" alignItems="center" justifyContent="space-between">
                    <Typography variant="h2">{t('reset-settings')}</Typography>
                    <ToggleSwitch
                        checked={resetWallet}
                        disabled={loading}
                        onChange={() => setResetWallet((p) => !p)}
                        label={t('reset-wallet')}
                    />
                    <Typography variant="p">{t('reset-permanently')}</Typography>
                    <Stack direction="row" justifyContent="space-between" style={{ marginTop: '8px' }}>
                        <SquaredButton disabled={loading} onClick={handleClose} color="warning">
                            {t('cancel')}
                        </SquaredButton>

                        {loading ? (
                            <CircularProgress />
                        ) : (
                            <SquaredButton disabled={loading} onClick={resetSettings}>
                                {t('yes')}
                            </SquaredButton>
                        )}
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};
