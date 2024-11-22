import { useInterval } from '@app/hooks/useInterval';
import { useAppStateStore } from '@app/store/appStateStore';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { checkUpdate, installUpdate, onUpdaterEvent } from '@tauri-apps/api/updater';
import { useUIStore } from '@app/store/useUIStore';
import * as Sentry from '@sentry/react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/tauri';

import { useCallback, useEffect, useRef, useState } from 'react';

export type UpdateStatus = 'NONE' | 'DOWNLOADING' | 'DONE';

interface UpdateStatusEvent {
    status: UpdateStatus;
    error: null | string;
}

interface UpdateDownloadProgressEvent {
    contentLength: number;
    chunkLength: number;
    downloaded: number;
}

export const useUpdateStatus = () => {
    const [status, setStatus] = useState<UpdateStatus>('NONE');
    const [contentLength, setContentLength] = useState<number>(0);
    const [downloaded, setDownloaded] = useState<number>(0);

    useEffect(() => {
        const ul = listen<UpdateStatusEvent>('tauri://update-status', (status) => {
            const statusString = status.payload.status;
            setStatus(statusString);
        });

        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, []);

    useEffect(() => {
        const ul = listen<UpdateDownloadProgressEvent>('update-progress', (progressEvent) => {
            const contentLength = progressEvent.payload.contentLength;
            setContentLength(contentLength);
            if (contentLength === 0) {
                setStatus('NONE');
            }
            if (contentLength > 0) {
                setStatus('DOWNLOADING');
                const downloaded = progressEvent.payload.downloaded;
                setDownloaded(downloaded);
            }
        });
        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, []);

    return { status, contentLength, downloaded };
};

const UPDATE_CHECK_INTERVAL = 1000 * 60 * 60; // 1 hour

export const useHandleUpdate = () => {
    const [isLoading, setIsLoading] = useState(false);
    const setIsAfterAutoUpdate = useAppStateStore((s) => s.setIsAfterAutoUpdate);
    const setDialogToShow = useUIStore((s) => s.setDialogToShow);

    const handleClose = useCallback(() => {
        setDialogToShow(null);
        setIsAfterAutoUpdate(true);
    }, [setIsAfterAutoUpdate, setDialogToShow]);

    const handleUpdate = useCallback(async () => {
        setIsLoading(true);
        await installUpdate();
        console.info('Installing latest version of Tari Universe');
        try {
            console.info('Restarting application after update');
            await invoke('restart_application', { shouldStopMiners: false });
        } catch (e) {
            Sentry.captureException(e);
            console.error('Relaunch error', e);
        }
        handleClose();
    }, [handleClose]);

    return { handleUpdate, isLoading, handleClose };
};

export function useUpdateListener() {
    const initialCheck = useRef(false);
    const setLatestVersion = useUIStore((s) => s.setLatestVersion);
    const auto_update = useAppConfigStore((s) => s.auto_update);
    const setIsAfterAutoUpdate = useAppStateStore((s) => s.setIsAfterAutoUpdate);
    const setDialogToShow = useUIStore((s) => s.setDialogToShow);

    const { handleUpdate, isLoading } = useHandleUpdate();
    const checkUpdateTariUniverse = useCallback(async () => {
        if (isLoading) return;
        try {
            const { shouldUpdate, manifest } = await checkUpdate();
            if (shouldUpdate) {
                console.info('New Tari Universe version available', manifest);
                if (manifest?.version) {
                    setLatestVersion(manifest?.version);
                }
                if (auto_update) {
                    console.info('Proceed with auto-update');
                    await handleUpdate();
                }
                setDialogToShow('autoUpdate');
            } else {
                setIsAfterAutoUpdate(true);
            }
        } catch (error) {
            Sentry.captureException(error);
            console.error('AutoUpdate error:', error);
            setIsAfterAutoUpdate(true);
        }
    }, [auto_update, handleUpdate, isLoading, setDialogToShow, setIsAfterAutoUpdate, setLatestVersion]);

    useInterval(() => checkUpdateTariUniverse(), UPDATE_CHECK_INTERVAL);

    useEffect(() => {
        const unlistenPromise = onUpdaterEvent(({ error, status }) => {
            // This will log all updater events, including status updates and errors.
            console.info('Updater event', error, status);
        });
        return () => {
            unlistenPromise?.then((unlisten) => unlisten());
        };
    }, [checkUpdateTariUniverse]);

    useEffect(() => {
        if (initialCheck.current) return;
        initialCheck.current = true;

        checkUpdateTariUniverse();
    }, [checkUpdateTariUniverse]);
}
