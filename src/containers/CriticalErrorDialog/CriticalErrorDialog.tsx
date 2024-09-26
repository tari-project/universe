import { Button, IconButton } from '@app/components/elements/Button';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { IoAlertCircleOutline, IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';

import { Trans, useTranslation } from 'react-i18next';
import { useAppStateStore } from '@app/store/appStateStore';
import { invoke } from '@tauri-apps/api';
import { useCallback, useState } from 'react';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { SendLogsDialog } from '@app/components/feedback/SendLogsDialog.tsx';
import { useUIStore } from '@app/store/useUIStore.ts';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';

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
                <Stack gap={14}>
                    <Typography variant="h1">{t('critical-error')}</Typography>
                    <Stack direction="row" alignItems="center" justifyContent="flex-start">
                        <IoAlertCircleOutline size={20} color="red" />
                        <Typography variant="p" style={{ fontStyle: 'italic' }}>
                            {criticalError}
                        </Typography>
                    </Stack>
                    <Typography variant="p">{t('please-try-again-later')}</Typography>

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
                        <Button color="error" onClick={handleExit}>
                            {t('close-tari-universe')}
                        </Button>
                    ) : (
                        <CircularProgress />
                    )}
                </Stack>
                <SendLogsDialog onSetReference={setLogsReference} />
            </DialogContent>
        </Dialog>
    );
};

export default CriticalErrorDialog;
