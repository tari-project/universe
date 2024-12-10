import { invoke } from '@tauri-apps/api/core';
import { useCallback } from 'react';

export const useNotifcations = () => {
    const winNotification = useCallback(async (winAmount: string) => {
        await invoke('trigger_notification', {
            summary: 'Congratulations !',
            body: `You won a block! We are sending you rewards of ${winAmount} tXTM!`,
        });
    }, []);

    const testNotification = useCallback(async () => {
        console.log('testNotification');
        await invoke('trigger_notification', {
            summary: 'Test Notification',
            body: 'This is a test notification.',
        });
    }, []);

    return { winNotification, testNotification };
};
