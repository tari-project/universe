import { useTranslation } from 'react-i18next';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

import { Divider } from '@app/components/elements/Divider.tsx';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Button } from '@app/components/elements/buttons/Button';
import RadioButton from '@app/components/elements/inputs/RadioButton.tsx';

interface ResetSettingsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}
export default function ResetSettingsDialog({ isOpen, onOpenChange }: ResetSettingsDialogProps) {
    const { t } = useTranslation('settings', { useSuspense: false });
    const setError = useAppStateStore((state) => state.setError);
    const [resetWalletSelected, setResetWalletSelected] = useState(false);
    const [loading, setLoading] = useState(false);

    function handleClose() {
        onOpenChange(false);
    }
    function resetSettings() {
        setLoading(true);
        invoke('reset_settings', { resetWallet })
            .then(() => {
                setLoading(false);
                handleClose();
            })
            .catch((e) => {
                console.error('Error when resetting settings: ', e);
                setError('Resetting settings failed: ' + e);
                setLoading(false);
                handleClose();
            });
    }

    const options = [
        { id: 'config_only', label: 'Reset all configuration settings' },
        { id: 'config_and_wallet', label: 'Reset all configuration settings, and generate a new wallet' },
    ];
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange} disableClose={loading}>
            <DialogContent>
                <Stack alignItems="center" justifyContent="space-between" gap={12} style={{ width: 500 }}>
                    <Typography variant="h2">{t('reset-settings')}</Typography>

                    {options.map(({ id, label }) => {
                        const checked = id === 'config_and_wallet' ? resetWalletSelected : !resetWalletSelected;
                        return (
                            <RadioButton
                                key={id}
                                id={id}
                                label={label}
                                variant="neutral"
                                styleType="aligned"
                                checked={checked}
                                onChange={(e) => setResetWalletSelected(e.target.id === 'config_and_wallet')}
                            />
                        );
                    })}

                    <Divider />

                    <Stack direction="row" justifyContent="space-between" gap={8}>
                        <Button disabled={loading} onClick={handleClose}>
                            {t('cancel')}
                        </Button>

                        {loading ? (
                            <CircularProgress />
                        ) : (
                            <Button disabled={loading} onClick={resetSettings} color="warning">
                                {t('yes')}
                            </Button>
                        )}
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
