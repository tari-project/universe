import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { checkUpdate, installUpdate, onUpdaterEvent } from '@tauri-apps/api/updater';
import { UnlistenFn } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/tauri';
import { Button } from '@app/components/elements/Button';
import { DialogContent, Dialog } from '@app/components/elements/dialog/Dialog';
import { useAppStateStore } from '@app/store/appStateStore';
import { Typography } from '@app/components/elements/Typography';
import { ButtonsWrapper } from './AutoUpdateDialog.styles';
import { CircularProgress } from '@app/components/elements/CircularProgress';

function AutoUpdateDialog() {
    const setIsAfterAutoUpdate = useAppStateStore((s) => s.setIsAfterAutoUpdate);
    const [latestVersion, setLatestVersion] = useState<string>();
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const { t } = useTranslation('setup-view', { useSuspense: false });

    useEffect(() => {
        let unlistenPromise: Promise<UnlistenFn>;

        const checkUpdateTariUniverse = async () => {
            unlistenPromise = onUpdaterEvent(({ error, status }) => {
                // This will log all updater events, including status updates and errors.
                console.info('Updater event', error, status);
            });

            try {
                const { shouldUpdate, manifest } = await checkUpdate();
                if (shouldUpdate) {
                    console.info('New Tari Universe version available', manifest);
                    setLatestVersion(manifest?.version);
                    setOpen(true);
                } else {
                    setIsAfterAutoUpdate(true);
                }
            } catch (error) {
                console.error(error);
                setIsAfterAutoUpdate(true);
            }
        };

        checkUpdateTariUniverse();
        return () => {
            unlistenPromise?.then((unlisten) => unlisten());
        };
    }, [setIsAfterAutoUpdate]);

    const handleUpdate = async () => {
        setIsLoading(true);
        await installUpdate();
        console.info('Installing latest version of Tari Universe');
        try {
            console.info('Restarting application after update');
            await invoke('restart_application');
            handleClose();
        } catch (e) {
            console.error('Relaunch error', e);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setIsAfterAutoUpdate(true);
    };

    const onOpenChange = (open: boolean) => {
        if (!open) {
            setIsAfterAutoUpdate(true);
        }
        setOpen(open);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <Typography variant="h3">{t('new-tari-version-available')}</Typography>
                <Typography variant="p">{t('would-you-like-to-install', { version: latestVersion })}</Typography>
                <ButtonsWrapper>
                    {!isLoading ? (
                        <>
                            <Button onClick={handleUpdate}>{t('yes')}</Button>
                            <Button onClick={handleClose}>{t('no')}</Button>
                        </>
                    ) : (
                        <CircularProgress />
                    )}
                </ButtonsWrapper>
            </DialogContent>
        </Dialog>
    );
}

export default AutoUpdateDialog;
