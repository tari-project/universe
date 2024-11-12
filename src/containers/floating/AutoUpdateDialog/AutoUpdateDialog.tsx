import { useUIStore } from '@app/store/useUIStore';

import { useTranslation } from 'react-i18next';

import { SquaredButton } from '@app/components/elements/buttons/SquaredButton';
import { DialogContent, Dialog } from '@app/components/elements/dialog/Dialog';
import { Typography } from '@app/components/elements/Typography';
import { ButtonsWrapper } from './AutoUpdateDialog.styles';
import { useHandleUpdate, useUpdateStatus } from '@app/hooks/useUpdateStatus';
import { UpdatedStatus } from './UpdatedStatus';

export default function AutoUpdateDialog() {
    const { t } = useTranslation('setup-view', { useSuspense: false });
    const { handleUpdate, handleClose, isLoading } = useHandleUpdate();
    const { contentLength, downloaded } = useUpdateStatus();

    const open = useUIStore((s) => s.dialogToShow === 'autoUpdate');
    const latestVersion = useUIStore((s) => s.latestVersion);

    const subtitle = isLoading ? 'installing-latest-version' : 'would-you-like-to-install';

    return (
        <Dialog open={open} onOpenChange={handleClose} disableClose>
            <DialogContent>
                <Typography variant="h3">{t('new-tari-version-available')}</Typography>
                <Typography variant="p">{t(subtitle, { version: latestVersion })}</Typography>
                {isLoading && <UpdatedStatus contentLength={contentLength} downloaded={downloaded} />}
                <ButtonsWrapper>
                    {!isLoading && (
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
