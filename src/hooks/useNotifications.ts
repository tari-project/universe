import { invoke } from '@tauri-apps/api/core';
import { useCallback } from 'react';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

export const useNotifcations = () => {
    const winNotification = useCallback(async (winAmount: string) => {
        await invoke('trigger_notification', {
            summary: 'Congratulations !',
            body: `You won a block! We are sending you rewards of ${winAmount} tXTM!`,
        });
    }, []);

    const testNotification = useCallback(async () => {
        console.log('testNotification');
        // Do you have permission to send a notification?
        let permissionGranted = await isPermissionGranted();

        console.log('permissionGranted', permissionGranted);
        // If not we need to request it
        if (!permissionGranted) {
            const permission = await requestPermission();
            permissionGranted = permission === 'granted';
        }

        // Once permission has been granted we can send the notification
        if (permissionGranted) {
            sendNotification({ title: 'Tauri', body: 'Tauri is awesome!' });
        }

        await invoke('trigger_notification', {
            summary: 'Test Notification',
            body: 'This is a test notification.',
        });
    }, []);

    return { winNotification, testNotification };
};
