import useAppStateStore from '@app/store/appStateStore';
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';
import { invoke } from '@tauri-apps/api';
import { useCallback, useState } from 'react';

export const ResetSettingsButton: React.FC = () => {
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
            <Button onClick={resetSettings} variant="outlined" color="error">
                Reset Settings
            </Button>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Reset Settings</DialogTitle>
                <DialogContent>
                    <DialogContentText>Are you sure you want to reset all settings permanently?</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button disabled={loading} onClick={resetSettings}>
                        {loading ? <CircularProgress /> : 'Yes'}
                    </Button>
                    <Button disabled={loading} onClick={handleClose}>
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
