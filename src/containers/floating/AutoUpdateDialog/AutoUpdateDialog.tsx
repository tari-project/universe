import { useTranslation } from 'react-i18next';

import { useUIStore } from '@app/store/useUIStore';
import { useHandleUpdate } from '@app/hooks';

import { DialogContent, Dialog } from '@app/components/elements/dialog/Dialog';
import { SquaredButton } from '@app/components/elements/buttons/SquaredButton';
import { Typography } from '@app/components/elements/Typography';

import { UpdatedStatus } from './UpdatedStatus';
import { ButtonsWrapper } from './AutoUpdateDialog.styles';
import { useEffect, useRef } from 'react';

export default function AutoUpdateDialog() {
    const hasFetched = useRef(false);
    const { handleUpdate, fetchUpdate, updateData, isLoading, contentLength, downloaded, handleClose } =
        useHandleUpdate();
    const { t } = useTranslation('setup-view', { useSuspense: false });

    const open = useUIStore((s) => s.dialogToShow === 'autoUpdate');

    useEffect(() => {
        if (hasFetched.current) return;
        fetchUpdate().then(() => {
            hasFetched.current = true;
        });
    }, [fetchUpdate]);

    const subtitle = isLoading ? 'installing-latest-version' : 'would-you-like-to-install';
    return (
        <Dialog open={open} onOpenChange={handleClose} disableClose>
            <DialogContent>
                <Typography variant="h3">{t('new-tari-version-available')}</Typography>
                <Typography variant="p">{t(subtitle, { version: updateData?.version })}</Typography>
                {isLoading && <UpdatedStatus contentLength={contentLength} downloaded={downloaded} />}

                {downloaded > 0 && downloaded === contentLength ? (
                    <Typography variant="p">{`Update downloaded: Restarting Tari Universe`}</Typography>
                ) : null}
                <ButtonsWrapper>
                    {!isLoading && updateData && (
                        <>
                            <SquaredButton onClick={() => handleClose()} color="warning">
                                {t('no')}
                            </SquaredButton>
                            <SquaredButton onClick={() => handleUpdate()} color="green">
                                {t('yes')}
                            </SquaredButton>
                        </>
                    )}
                </ButtonsWrapper>
            </DialogContent>
        </Dialog>
    );
}
