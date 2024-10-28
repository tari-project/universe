import * as Sentry from '@sentry/react';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { checkUpdate, installUpdate, onUpdaterEvent } from '@tauri-apps/plugin-updater';

import { invoke } from '@tauri-apps/api/core';
import { SquaredButton } from '@app/components/elements/buttons/SquaredButton';
import { DialogContent, Dialog } from '@app/components/elements/dialog/Dialog';
import { useAppStateStore } from '@app/store/appStateStore';
import { Typography } from '@app/components/elements/Typography';
import { ButtonsWrapper } from './AutoUpdateDialog.styles';
import { useUpdateStatus } from '@app/hooks/useUpdateStatus';
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
    const { contentLength, downloaded } = useUpdateStatus();
    const { t } = useTranslation('setup-view', { useSuspense: false });

    const handleClose = useCallback(() => {
        setOpen(false);
        setIsAfterAutoUpdate(true);
    }, [setIsAfterAutoUpdate]);

    const handleUpdate = useCallback(async () => {
        setIsLoading(true);
        await installUpdate();
        console.info('Installing latest version of Tari Universe');
        try {
            console.info('Restarting application after update');
            await invoke('restart_application');
        } catch (e) {
            Sentry.captureException(e);
            console.error('Relaunch error', e);
        }
        handleClose();
    }, [handleClose]);

    const checkUpdateTariUniverse = useCallback(async () => {
        try {
            const { shouldUpdate, manifest } = await checkUpdate();
            if (shouldUpdate) {
                console.info('New Tari Universe version available', manifest);
                setLatestVersion(manifest?.version);
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

    const onOpenChange = (open: boolean) => {
        if (!open) {
            setIsAfterAutoUpdate(true);
        }
        setOpen(open);
    };

    useEffect(() => {
        checkUpdateTariUniverse();
        const unlistenPromise = onUpdaterEvent(({ error, status }) => {
            // This will log all updater events, including status updates and errors.
            console.info('Updater event', error, status);
        });
        return () => {
            unlistenPromise?.then((unlisten) => unlisten());
        };
    }, [checkUpdateTariUniverse]);

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
