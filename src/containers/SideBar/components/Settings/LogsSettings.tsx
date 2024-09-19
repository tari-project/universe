import { Typography } from '@app/components/elements/Typography.tsx';
import { Button } from '@app/components/elements/Button.tsx';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/tauri';
import { Stack } from '@app/components/elements/Stack.tsx';
import { useCallback, useState } from 'react';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';

export default function LogsSettings() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [feedback, _setFeedback] = useState('App feedback');
    const [error, setError] = useState('');
    const sendLogs = useCallback(() => {
        setLoading(true);
        setError('');
        invoke('send_feedback', { feedback, includeLogs: true })
            .then(() => {
                setOpen(false);
            })
            .catch((error) => {
                setError(error.toString());
            })
            .finally(() => {
                setLoading(false);
            });
    }, [feedback]);
    const openLogsDirectory = () => {
        invoke('open_log_dir')
            .then(() => {
                console.info('Opening logs directory');
            })
            .catch((error) => {
                console.error(error);
            });
    };

    const handleClose = useCallback(() => {
        setOpen(false);
    }, [setOpen]);

    return (
        <Stack direction="row" justifyContent="space-between">
            <Typography variant="h6">{t('logs', { ns: 'settings' })}</Typography>
            <Button onClick={openLogsDirectory} variant="text" styleVariant="simple">
                {t('open-logs-directory', { ns: 'settings' })}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <Button onClick={() => setOpen(true)} styleVariant="outline" color="secondary">
                    {t('send-logs', { ns: 'settings' })}
                </Button>
                <DialogContent>
                    <Stack direction="column" alignItems="center" justifyContent="space-between">
                        <Typography variant="h3">{t('send-logs', { ns: 'settings' })}</Typography>
                        <Typography variant={'p'}>{error}</Typography>
                        <Stack direction="row">
                            <Button disabled={loading} onClick={handleClose} color="warning">
                                {t('cancel')}
                            </Button>
                            {loading ? (
                                <CircularProgress />
                            ) : (
                                <Button disabled={loading} onClick={sendLogs}>
                                    {t('submit')}
                                </Button>
                            )}
                        </Stack>
                    </Stack>
                </DialogContent>
            </Dialog>
        </Stack>
    );
}
