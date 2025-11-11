import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { useTranslation } from 'react-i18next';
import { useAppStateStore } from '@app/store/appStateStore';
import { invoke } from '@tauri-apps/api/core';
import { memo, useCallback, useState } from 'react';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { SpinnerIcon } from '@app/components/elements/loaders/SpinnerIcon.tsx';

// currently only used with macOS installation location error
// no logs or restart required as user will need to move to the Applications directory first

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
                <Stack gap={18} alignItems="center" style={{ maxWidth: 500 }}>
                    <Typography variant="h2">{t(criticalError?.title || 'common:installation-problem')}</Typography>
                    <Stack style={{ width: '90%', textAlign: 'center' }} alignItems="center" gap={14}>
                        <Typography>{t(criticalError?.description || 'common:installation-problem')}</Typography>

                        <Button
                            fluid
                            size="small"
                            backgroundColor="error"
                            onClick={handleExit}
                            isLoading={isExiting}
                            disabled={isExiting}
                            loader={<SpinnerIcon />}
                        >
                            {t('close-tari-universe')}
                        </Button>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
});

export default CriticalErrorDialog;
