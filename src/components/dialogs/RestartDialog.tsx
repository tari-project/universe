import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { useUIStore } from '@app/store/useUIStore.ts';

import { IoClose } from 'react-icons/io5';
import { Divider } from '@app/components/elements/Divider.tsx';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { useTheme } from 'styled-components';
import { CircularProgress } from '../elements/CircularProgress';

export default function RestartDialog() {
    const dialogToShow = useUIStore((s) => s.dialogToShow);
    const setDialogToShow = useUIStore((s) => s.setDialogToShow);
    const [isRestarting, setIsRestarting] = useState(false);
    const { t } = useTranslation('settings', { useSuspense: false });

    const showRestartModal = dialogToShow === 'restart';
    const theme = useTheme();

    const setShowRestartModal = useCallback(() => {
        setDialogToShow(showRestartModal ? null : 'restart');
    }, [setDialogToShow, showRestartModal]);

    const handleRestart = useCallback(async () => {
        try {
            setIsRestarting(true);
            console.info('Restarting application.');
            await invoke('restart_application', { shouldStopMiners: true });
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

                        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={8}>
                            {isRestarting ? (
                                <CircularProgress />
                            ) : (
                                <>
                                    <TextButton
                                        color="grey"
                                        colorIntensity={theme.mode === 'light' ? 700 : 200}
                                        onClick={setShowRestartModal}
                                    >
                                        {t('restart-later')}
                                    </TextButton>
                                    <Button size="small" variant="gradient" onClick={handleRestart}>
                                        {t('restart-now')}
                                    </Button>
                                </>
                            )}
                        </Stack>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
