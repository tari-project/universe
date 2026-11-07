import { invoke } from '@tauri-apps/api/core';
import { useCallback, useState } from 'react';
import { setCriticalProblem } from '@app/store/actions/appStateStoreActions.ts';

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

    // The user asked to start fresh: the backend creates the new wallet and brings it up in the
    // running app, so the dialog just closes. On failure it stays open.
    const handleStartFresh = useCallback(async () => {
        try {
            setIsExiting(true);
            await invoke('discard_unreadable_wallet_config');
            setCriticalProblem();
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
