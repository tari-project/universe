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

    return {
        isExiting,
        handleClose,
        handleRestart,
    };
};
