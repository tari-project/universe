import { invoke } from '@tauri-apps/api/core';
import { useCallback, useState } from 'react';

export const useErrorDialogsButtonsLogic = () => {
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = useCallback(async () => {
        try {
            setIsExiting(true);
            await invoke('exit_application');
        } catch (e) {
            console.error('Error closing application | handleClose in CriticalProblemDialog: ', e);
        }
        setIsExiting(false);
    }, []);

    const handleRestart = useCallback(async () => {
        try {
            setIsExiting(true);
            await invoke('restart_application');
        } catch (e) {
            console.error('Error restarting application| handleRestart in CriticalProblemDialog: ', e);
        }
        setIsExiting(false);
    }, []);

    // The user has confirmed their seed words are backed up: move the unreadable wallet
    // config aside and restart so setup creates a new wallet.
    const handleStartFresh = useCallback(async () => {
        try {
            setIsExiting(true);
            await invoke('discard_unreadable_wallet_config');
            await invoke('restart_application');
        } catch (e) {
            console.error('Error discarding the wallet config | handleStartFresh in CriticalProblemDialog: ', e);
        }
        setIsExiting(false);
    }, []);

    return {
        isExiting,
        handleClose,
        handleRestart,
        handleStartFresh,
    };
};
