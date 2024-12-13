import Linkify from 'linkify-react';

import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { IoAlertCircleOutline, IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';
import { Trans, useTranslation } from 'react-i18next';
import { useAppStateStore } from '@app/store/appStateStore';
import { invoke } from '@tauri-apps/api/core';
import { useCallback, useState } from 'react';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { SendLogsDialog } from '@app/components/dialogs/SendLogsDialog.tsx';
import { useUIStore } from '@app/store/useUIStore.ts';
import { useCopyToClipboard } from '@app/hooks';
import { SquaredButton } from '@app/components/elements/buttons/SquaredButton.tsx';
import { IconButton } from '@app/components/elements/buttons/IconButton';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';

const CriticalErrorDialog = () => {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const setDialogToShow = useUIStore((s) => s.setDialogToShow);
    const { isCopied, copyToClipboard } = useCopyToClipboard();
    const [logsReference, setLogsReference] = useState('');
    const criticalError = useAppStateStore((s) => s.criticalError);
    const [isExiting, setIsExiting] = useState(false);
    // Write the critical error to the web log file
    // console.error(criticalError);
    const handleExit = useCallback(async () => {
        try {
            setIsExiting(true);
            await invoke('exit_application');
        } catch (e) {
            console.error('Error closing application| handleExit in CriticalErrorDialog: ', e);
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
                        <Typography variant="p" style={{ fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                            <Linkify options={{ attributes: { target: '_blank' } }}>{criticalError}</Linkify>
                        </Typography>
                    </Stack>
                    <Typography variant="p">{t('please-try-again-later')}</Typography>

                    {!logsReference ? (
                        <TextButton color="warning" colorIntensity={200} onClick={() => setDialogToShow('logs')}>
                            {t('send-logs', { ns: 'settings' })}
                        </TextButton>
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
                        <SquaredButton color="error" onClick={handleExit}>
                            {t('close-tari-universe')}
                        </SquaredButton>
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
