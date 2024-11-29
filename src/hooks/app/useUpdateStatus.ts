import * as Sentry from '@sentry/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

import { useAppStateStore } from '@app/store/appStateStore';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { useUIStore } from '@app/store/useUIStore';
import { useInterval } from '../helpers/useInterval';

const UPDATE_CHECK_INTERVAL = 1000 * 60 * 60; // 1 hour

export const useHandleUpdate = () => {
    const setIsAfterAutoUpdate = useAppStateStore((s) => s.setIsAfterAutoUpdate);
    const auto_update = useAppConfigStore((s) => s.auto_update);
    const [latestVersion, setLatestVersion] = useState<string>();
    const [isLoading, setIsLoading] = useState(false);
    const [contentLength, setContentLength] = useState(0);
    const [downloaded, setDownloaded] = useState(0);
    const [update, setUpdate] = useState<Update>();
    const setDialogToShow = useUIStore((s) => s.setDialogToShow);

    const handleClose = useCallback(() => {
        setDialogToShow(null);
        setIsAfterAutoUpdate(true);
    }, [setIsAfterAutoUpdate, setDialogToShow]);

    const handleUpdate = useCallback(async () => {
        if (!update) {
            return;
        }
        setIsLoading(true);
        console.info('Installing latest version of Tari Universe');

        await update.downloadAndInstall((event) => {
            switch (event.event) {
                case 'Started':
                    setContentLength(event.data.contentLength || 0);
                    break;
                case 'Progress':
                    setDownloaded((c) => c + event.data.chunkLength);
                    break;
                case 'Finished':
                    console.info('download finished');
                    break;
            }
        });
        handleClose();
        await relaunch();
    }, [handleClose, update]);

    const checkUpdateTariUniverse = useCallback(async () => {
        try {
            const updateRes = await check();
            if (updateRes?.available) {
                setUpdate(updateRes);
                console.info(`New Tari Universe version: ${updateRes.version} available`);
                console.info(`Release notes: ${updateRes.body}`);
                setLatestVersion(updateRes.version);
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
    }, [auto_update, handleUpdate, setIsAfterAutoUpdate, setDialogToShow]);

    return { checkUpdateTariUniverse, handleUpdate, isLoading, handleClose, latestVersion, contentLength, downloaded };
};

export function useUpdateListener() {
    const { checkUpdateTariUniverse } = useHandleUpdate();
    const hasDoneInitialCheck = useRef(false);

    useInterval(() => checkUpdateTariUniverse(), UPDATE_CHECK_INTERVAL);

    useEffect(() => {
        if (hasDoneInitialCheck.current) return;
        checkUpdateTariUniverse().then(() => {
            hasDoneInitialCheck.current = true;
        });
    }, [checkUpdateTariUniverse]);
}
