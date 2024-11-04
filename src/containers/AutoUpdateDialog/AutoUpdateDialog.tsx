import * as Sentry from '@sentry/react';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { SquaredButton } from '@app/components/elements/buttons/SquaredButton';
import { DialogContent, Dialog } from '@app/components/elements/dialog/Dialog';
import { useAppStateStore } from '@app/store/appStateStore';
import { Typography } from '@app/components/elements/Typography';
import { ButtonsWrapper } from './AutoUpdateDialog.styles';
import { UpdatedStatus } from './UpdatedStatus';
import { useInterval } from '@app/hooks/useInterval.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore';

const UPDATE_CHECK_INTERVAL = 1000 * 60 * 60; // 1 hour
function AutoUpdateDialog() {
    const setIsAfterAutoUpdate = useAppStateStore((s) => s.setIsAfterAutoUpdate);
    const auto_update = useAppConfigStore((s) => s.auto_update);
    const [latestVersion, setLatestVersion] = useState<string>();
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [contentLength, setContentLength] = useState(0);
    const [downloaded, setDownloaded] = useState(0);
    const [update, setUpdate] = useState<Update>();
    const hasDoneInitialCheck = useRef(false);
    const { t } = useTranslation('setup-view', { useSuspense: false });

    const handleClose = useCallback(() => {
        setOpen(false);
        setIsAfterAutoUpdate(true);
    }, [setIsAfterAutoUpdate]);

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
                setOpen(true);
            } else {
                setIsAfterAutoUpdate(true);
            }
        } catch (error) {
            Sentry.captureException(error);
            console.error('AutoUpdate error:', error);
            setIsAfterAutoUpdate(true);
        }
    }, [auto_update, handleUpdate, setIsAfterAutoUpdate]);

    useInterval(() => checkUpdateTariUniverse(), UPDATE_CHECK_INTERVAL);

    useEffect(() => {
        if (hasDoneInitialCheck.current) return;
        checkUpdateTariUniverse().then(() => {
            hasDoneInitialCheck.current = true;
        });
    }, [checkUpdateTariUniverse]);

    const onOpenChange = (open: boolean) => {
        if (!open) {
            setIsAfterAutoUpdate(true);
        }
        setOpen(open);
    };

    const subtitle = isLoading ? 'installing-latest-version' : 'would-you-like-to-install';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <Typography variant="h3">{t('new-tari-version-available')}</Typography>
                <Typography variant="p">{t(subtitle, { version: latestVersion })}</Typography>
                {isLoading && <UpdatedStatus contentLength={contentLength} downloaded={downloaded} />}
                <ButtonsWrapper>
                    {!isLoading && (
                        <>
                            <SquaredButton onClick={handleClose} color="warning">
                                {t('no')}
                            </SquaredButton>
                            <SquaredButton onClick={handleUpdate} color="green">
                                {t('yes')}
                            </SquaredButton>
                        </>
                    )}
                </ButtonsWrapper>
            </DialogContent>
        </Dialog>
    );
}

export default AutoUpdateDialog;
