import useAppStateStore from '@app/store/appStateStore';

import { invoke } from '@tauri-apps/api';
import { useCallback, useState } from 'react';
import { Button } from '@app/components/elements/Button.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { useTranslation } from 'react-i18next';

export const ResetSettingsButton = () => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const setError = useAppStateStore((state) => state.setError);
    const { t } = useTranslation('settings', { useSuspense: false });

    const resetSettings = () => {
        setLoading(true);
        invoke('reset_settings')
            .then(() => {
                setLoading(false);
                setOpen(false);
            })
            .catch((e) => {
                console.error('Error when resetting settings: ', e);
                setError('Resetting settings failed: ' + e);
            });
    };

    const handleClose = useCallback(() => {
        setOpen(false);
    }, [setOpen]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Button onClick={() => setOpen(true)} styleVariant="outline" color="error">
                {t('reset-settings')}
            </Button>
            <DialogContent>
                <Stack direction="column" alignItems="center" justifyContent="space-between">
                    <Typography variant="h2">{t('reset-settings')}</Typography>
                    <Typography variant="p">{t('reset-permanently')}</Typography>
                    <Stack direction="row">
                        <Button disabled={loading} onClick={handleClose} color="warning">
                            {t('cancel')}
                        </Button>

                        {loading ? (
                            <CircularProgress />
                        ) : (
                            <Button disabled={loading} onClick={resetSettings}>
                                {t('yes')}
                            </Button>
                        )}
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};
