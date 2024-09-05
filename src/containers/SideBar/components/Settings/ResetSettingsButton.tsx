import useAppStateStore from '@app/store/appStateStore';

import { invoke } from '@tauri-apps/api';
import { useCallback, useState } from 'react';
import { Button } from '@app/components/elements/Button.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';

export const ResetSettingsButton = () => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const setError = useAppStateStore((state) => state.setError);

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
                Reset Settings
            </Button>
            <DialogContent>
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
            </DialogContent>
        </Dialog>
    );
};
