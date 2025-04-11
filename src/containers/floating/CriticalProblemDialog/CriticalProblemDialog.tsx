import { SquaredButton } from '@app/components/elements/buttons/SquaredButton';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { useAppStateStore } from '@app/store/appStateStore';
import { invoke } from '@tauri-apps/api/core';

import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

const CriticalProblemDialog = memo(function CriticalProblemDialog() {
    const { t } = useTranslation('setup-progresses', { useSuspense: false });
    const criticalProblem = useAppStateStore((s) => s.criticalProblem);
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = useCallback(async () => {
        try {
            setIsExiting(true);
            await invoke('exit_application');
        } catch (e) {
            console.error('Error closing application| handleClose in CriticalProblemDialog: ', e);
        }
        setIsExiting(false);
    }, []);

    const handleRestart = useCallback(async () => {
        try {
            setIsExiting(true);
            await invoke('restart_application');
        } catch (e) {
            console.error('Error restarting application| handleRestart in CriticalProblemDialog: ', e);
        }
        setIsExiting(false);
    }, []);

    return (
        <Dialog open={!!criticalProblem}>
            <DialogContent>
                <Stack gap={16}>
                    <Stack gap={4} style={{ maxWidth: '480px' }}>
                        <Typography variant="h4">{t(criticalProblem?.title || 'installation-problem')}</Typography>
                        <Typography variant="p">{t(criticalProblem?.description || 'installation-problem')}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="center" gap={8}>
                        {isExiting ? (
                            <CircularProgress />
                        ) : (
                            <Stack direction="row" gap={8} justifyContent="space-around">
                                <SquaredButton
                                    color="error"
                                    size="medium"
                                    onClick={handleClose}
                                    style={{ width: '100%' }}
                                >
                                    {t('close-tari-universe')}
                                </SquaredButton>
                                <SquaredButton
                                    color="warning"
                                    size="medium"
                                    onClick={handleRestart}
                                    style={{ width: '100%' }}
                                >
                                    {t('restart')}
                                </SquaredButton>
                            </Stack>
                        )}
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
});

export default CriticalProblemDialog;
