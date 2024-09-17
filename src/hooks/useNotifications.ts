import { invoke } from '@tauri-apps/api/tauri';
import { useCallback } from 'react';

export const useNotifcations = () => {
    const winNotification = useCallback(async (winAmount: string) => {
        await invoke('trigger_notification', {
            summary: 'You won!',
            body: `You won ${winAmount}!`,
        });
    }, []);

    const testNotification = useCallback(async () => {
        await invoke('trigger_notification', {
            summary: 'Test Notification',
            body: 'This is a test notification.',
        });
    }, []);

    return { winNotification, testNotification };
};
