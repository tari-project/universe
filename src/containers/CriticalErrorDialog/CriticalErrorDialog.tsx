import { Button } from '@app/components/elements/Button';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { IoAlertCircleOutline } from 'react-icons/io5';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useAppStateStore } from '@app/store/appStateStore';
import { invoke } from '@tauri-apps/api';
import { useCallback, useState } from 'react';
import { CircularProgress } from '@app/components/elements/CircularProgress';

const StyledButton = styled(Button)(() => ({
    marginTop: '16px',
}));

const CriticalErrorDialog = () => {
    const { t } = useTranslation('common', { useSuspense: false });
    const criticalError = useAppStateStore((s) => s.criticalError);
    const [isExiting, setIsExiting] = useState(false);

    const handleExit = useCallback(async () => {
        try {
            setIsExiting(true);
            await invoke('exit_application');
        } catch (e) {
            console.error(e);
        }
        setIsExiting(false);
    }, []);

    return (
        <Dialog
            open={!!criticalError}
            onOpenChange={() => {
                /* void */
            }}
        >
            <DialogContent>
                <Typography variant="h1">{t('critical-error')}</Typography>
                <Stack direction="row" alignItems="center">
                    <IoAlertCircleOutline size={20} color="red" />
                    <Typography variant="p" style={{ textDecoration: 'italic' }}>
                        {criticalError}
                    </Typography>
                </Stack>
                <Typography variant="p" style={{ marginTop: '8px' }}>
                    {t('please-try-again-later')}
                </Typography>
                {!isExiting ? (
                    <StyledButton color="error" onClick={handleExit}>
                        {t('close-tari-universe')}
                    </StyledButton>
                ) : (
                    <CircularProgress />
                )}
            </DialogContent>
        </Dialog>
    );
};

export default CriticalErrorDialog;
