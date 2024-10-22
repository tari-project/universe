import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/tauri';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { ButtonBase } from '@app/components/elements/buttons/ButtonBase.tsx';
import { useUIStore } from '@app/store/useUIStore.ts';
import { IconButton } from '@app/components/elements/Button.tsx';
import { IoClose } from 'react-icons/io5';
import { Divider } from '@app/components/elements/Divider.tsx';

export default function RestartDialog() {
    const dialogToShow = useUIStore((s) => s.dialogToShow);
    const setDialogToShow = useUIStore((s) => s.setDialogToShow);
    const { t } = useTranslation('settings', { useSuspense: false });

    const showRestartModal = dialogToShow === 'restart';

    const setShowRestartModal = useCallback(() => {
        setDialogToShow(showRestartModal ? null : 'restart');
    }, [setDialogToShow, showRestartModal]);

    const handleRestart = useCallback(async () => {
        try {
            console.info('Restarting application.');
            await invoke('restart_application');
        } catch (error) {
            console.error('Restart error: ', error);
        }
    }, []);

    return (
        <Dialog open={showRestartModal} onOpenChange={setShowRestartModal}>
            <DialogContent>
                <Stack style={{ minWidth: 400 }}>
                    <Stack justifyContent="space-between" direction="row" alignItems="center">
                        <Typography variant="h3">{t('restart-universe')}</Typography>
                        <IconButton onClick={setShowRestartModal}>
                            <IoClose size={18} />
                        </IconButton>
                    </Stack>
                    <Divider />
                    <Stack direction="column" alignItems="center" justifyContent="space-between" gap={24}>
                        <Stack gap={6}>
                            <Typography variant="p">{t('action-requires-restart')}</Typography>
                            <Typography variant="p">{t('action-restart-copy')}</Typography>
                        </Stack>

                        <ButtonBase size="small" variant="outlined" onClick={handleRestart}>
                            {t('restart-now')}
                        </ButtonBase>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
