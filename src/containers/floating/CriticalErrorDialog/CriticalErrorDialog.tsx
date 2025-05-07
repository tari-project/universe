import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { useTranslation } from 'react-i18next';
import { useAppStateStore } from '@app/store/appStateStore';
import { invoke } from '@tauri-apps/api/core';
import { memo, useCallback, useState } from 'react';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { SquaredButton } from '@app/components/elements/buttons/SquaredButton.tsx';

const CriticalErrorDialog = memo(function CriticalErrorDialog() {
    const { t } = useTranslation('common', { useSuspense: false });
    const criticalError = useAppStateStore((s) => s.criticalError);
    const [isExiting, setIsExiting] = useState(false);
    const handleExit = useCallback(async () => {
        try {
            setIsExiting(true);
            await invoke('exit_application');
        } catch (e) {
            console.error('Error closing application | handleExit in CriticalErrorDialog: ', e);
        }
        setIsExiting(false);
    }, []);

    return (
        <Dialog open={!!criticalError}>
            <DialogContent>
                <Stack gap={14}>
                    <Typography variant="h1">{t(criticalError?.title || 'common:installation-problem')}</Typography>
                    <Typography variant="p">
                        {t(criticalError?.description || 'common:installation-problem')}
                    </Typography>

                    {!isExiting ? (
                        <SquaredButton color="error" onClick={handleExit}>
                            {t('close-tari-universe')}
                        </SquaredButton>
                    ) : (
                        <CircularProgress />
                    )}
                </Stack>
            </DialogContent>
        </Dialog>
    );
});

export default CriticalErrorDialog;
