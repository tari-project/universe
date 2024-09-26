import { Button, IconButton } from '@app/components/elements/Button';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { IoAlertCircleOutline, IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';
import styled from 'styled-components';
import { Trans, useTranslation } from 'react-i18next';
import { useAppStateStore } from '@app/store/appStateStore';
import { invoke } from '@tauri-apps/api';
import { useCallback, useState } from 'react';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { SendLogsDialog } from '@app/components/feedback/SendLogsDialog.tsx';
import { useUIStore } from '@app/store/useUIStore.ts';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';
import { Divider } from '@app/components/elements/Divider.tsx';

const StyledButton = styled(Button)(() => ({
    marginTop: '16px',
}));

const CriticalErrorDialog = () => {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const setShowLogsDialog = useUIStore((s) => s.setShowLogsDialog);
    const { isCopied, copyToClipboard } = useCopyToClipboard();
    const [logsReference, setLogsReference] = useState('');
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
        <Dialog open={!!criticalError}>
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
                <Divider />

                {!logsReference ? (
                    <Button
                        color="warning"
                        variant="text"
                        styleVariant="simple"
                        onClick={() => setShowLogsDialog(true)}
                    >
                        {t('send-logs', { ns: 'settings' })}
                    </Button>
                ) : (
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="p">
                            <Trans
                                t={t}
                                i18nKey="your-reference"
                                ns="settings"
                                values={{ logRef: logsReference }}
                                components={{ bold: <strong />, br: <br /> }}
                            />
                        </Typography>
                        <IconButton onClick={() => copyToClipboard(logsReference)} size="small">
                            {!isCopied ? <IoCopyOutline /> : <IoCheckmarkOutline />}
                        </IconButton>
                    </Stack>
                )}

                {!isExiting ? (
                    <StyledButton color="error" onClick={handleExit}>
                        {t('close-tari-universe')}
                    </StyledButton>
                ) : (
                    <CircularProgress />
                )}
            </DialogContent>
            <SendLogsDialog onSetReference={setLogsReference} />
        </Dialog>
    );
};

export default CriticalErrorDialog;
