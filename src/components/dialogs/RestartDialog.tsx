import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/tauri';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { ButtonBase } from '@app/components/elements/buttons/ButtonBase.tsx';
import { useUIStore } from '@app/store/useUIStore.ts';

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
                <Stack direction="column" alignItems="center" justifyContent="space-between" style={{ height: 120 }}>
                    <Stack>
                        <Typography variant="h3">{t('restart-universe')}</Typography>
                        <Typography variant="p">{t('action-requires-restart')}</Typography>
                    </Stack>

                    <Stack direction="row" gap={8}>
                        <ButtonBase size="small" onClick={setShowRestartModal}>
                            {t('cancel')}
                        </ButtonBase>
                        <ButtonBase size="small" variant="outlined" onClick={handleRestart}>
                            {t('restart-now')}
                        </ButtonBase>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
