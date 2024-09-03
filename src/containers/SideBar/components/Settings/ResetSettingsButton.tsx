import useAppStateStore from '@app/store/appStateStore';

import { invoke } from '@tauri-apps/api';
import { useCallback, useState } from 'react';
import { Button } from '@app/components/elements/Button.tsx';
import Dialog from '@app/components/elements/Dialog.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';

export const ResetSettingsButton = () => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const setError = useAppStateStore((state) => state.setError);

    const resetSettings = () => {
        if (!open) {
            setOpen(true);
            return;
        }
        setLoading(true);
        invoke('reset_settings')
            .then(() => {
                setLoading(false);
            })
            .catch((e) => {
                console.error('Error when resetting settings: ', e);
                setError('Resetting settings failed: ' + e);
            });
        setOpen(false);
    };

    const handleClose = useCallback(() => {
        setOpen(false);
    }, [setOpen]);

    return (
        <>
            <Button onClick={resetSettings} styleVariant="outline" color="error">
                Reset Settings
            </Button>
            <Dialog open={open} onClose={handleClose}>
                <Stack direction="column" alignItems="center" justifyContent="space-between">
                    <Typography variant="h2">Reset Settings</Typography>
                    <Typography variant="p">Are you sure you want to reset all settings permanently?</Typography>
                    <Stack direction="row">
                        <Button disabled={loading} onClick={handleClose} color="warning">
                            Cancel
                        </Button>
                        <Button disabled={loading} onClick={resetSettings}>
                            {loading ? <CircularProgress /> : 'Yes'}
                        </Button>
                    </Stack>
                </Stack>
            </Dialog>
        </>
    );
};
