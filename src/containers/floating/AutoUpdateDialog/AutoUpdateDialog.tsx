import { useTranslation } from 'react-i18next';

import { useUIStore } from '@app/store/useUIStore';

import { DialogContent, Dialog } from '@app/components/elements/dialog/Dialog';
import { SquaredButton } from '@app/components/elements/buttons/SquaredButton';
import { Typography } from '@app/components/elements/Typography';

import { UpdatedStatus } from './UpdatedStatus';
import { ButtonsWrapper } from './AutoUpdateDialog.styles';
import { useCallback, useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

interface DownloadProgressPayload {
    event_type: 'download_progress';
    downloaded: number;
    total: number;
}

interface AskForUpdatePayload {
    event_type: 'ask_for_update';
    version: string;
}

export default function AutoUpdateDialog() {
    const { t } = useTranslation('setup-view', { useSuspense: false });
    const open = useUIStore((s) => s.dialogToShow === 'autoUpdate');
    const setDialogToShow = useUIStore((s) => s.setDialogToShow);
    const [version, setVersion] = useState('');
    const [downloaded, setDownloaded] = useState(0);
    const [contentLength, setContentLength] = useState(0);

    const isDownloading = downloaded > 0;
    const isDownloaded = isDownloading && downloaded === contentLength;
    const subtitle = isDownloading ? 'installing-latest-version' : 'would-you-like-to-install';

    useEffect(() => {
        const unlistenPromise = listen(
            'updates_event',
            ({ payload }: { payload: AskForUpdatePayload | DownloadProgressPayload }) => {
                switch (payload.event_type) {
                    case 'ask_for_update':
                        setDialogToShow('autoUpdate');
                        setVersion(payload.version);
                        break;
                    case 'download_progress':
                        if (!open) {
                            // open when auto update is triggered
                            setDialogToShow('autoUpdate');
                        }
                        setDownloaded(payload.downloaded);
                        setContentLength(payload.total);
                        break;
                    default:
                        console.warn('Unknown tauri event: ', payload);
                        break;
                }
            }
        );
        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleClose = useCallback(() => {
        console.info('Update declined');
        setDialogToShow(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleUpdate = useCallback(() => {
        console.info('Proceed with update');
        invoke('proceed_with_update').catch((e) => console.error('Failed to proceed with update', e));
    }, []);

    return (
        <Dialog open={open} onOpenChange={handleClose} disableClose>
            <DialogContent>
                <Typography variant="h3">{t('new-tari-version-available')}</Typography>
                <Typography variant="p">{t(subtitle, { version })}</Typography>
                {isDownloading && <UpdatedStatus contentLength={contentLength} downloaded={downloaded} />}
                {isDownloaded && <Typography variant="p">{`Update downloaded: Restarting Tari Universe`}</Typography>}
                <ButtonsWrapper>
                    {!isDownloading && (
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
