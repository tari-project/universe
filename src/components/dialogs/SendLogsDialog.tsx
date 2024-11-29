import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/tauri';

import { useUIStore } from '@app/store/useUIStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

import { Stack } from '@app/components/elements/Stack.tsx';

import { TextArea } from '@app/components/elements/inputs/TextArea.tsx';
import { SquaredButton } from '@app/components/elements/buttons/SquaredButton.tsx';

export function SendLogsDialog({ onSetReference }: { onSetReference?: (reference: string) => void }) {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const dialogToShow = useUIStore((s) => s.dialogToShow);
    const setDialogToShow = useUIStore((s) => s.setDialogToShow);

    const showLogsDialog = dialogToShow === 'logs';

    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);

    const setShowLogsDialog = useCallback(() => {
        if (showLogsDialog) {
            setDialogToShow(null);
        } else {
            setDialogToShow('logs');
        }
    }, [setDialogToShow, showLogsDialog]);

    const sendLogs = useCallback(() => {
        setLoading(true);
        setError('');
        if (!feedback) {
            setError(t('feedback-required', { ns: 'settings' }));
            setLoading(false);
            return;
        }
        invoke('send_feedback', { feedback, includeLogs: true })
            .then((r) => {
                setDialogToShow(null);
                onSetReference?.(r);
            })
            .catch((error) => {
                console.error('Error sending feedback: ', error);
                setError(error.toString());
            })
            .finally(() => {
                setLoading(false);
            });
    }, [feedback, onSetReference, setDialogToShow, t]);

    return (
        <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
            <DialogContent>
                <Stack direction="column" alignItems="center" justifyContent="space-between" gap={20}>
                    <Typography variant="h3">{t('send-logs', { ns: 'settings' })}</Typography>
                    <TextArea
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder={t('your-feedback', { ns: 'settings' })}
                        minWidth="500px"
                        minHeight="200px"
                        value={feedback}
                    />
                    <Typography variant={'p'} color={'red'}>
                        {error}
                    </Typography>
                </Stack>
                <Stack direction="row">
                    {loading ? (
                        <CircularProgress />
                    ) : (
                        <Stack direction="row" gap={10}>
                            <SquaredButton disabled={loading} onClick={setShowLogsDialog} color="grey">
                                {t('cancel')}
                            </SquaredButton>
                            <SquaredButton
                                disabled={loading || !feedback?.length || feedback?.trim() === ''}
                                onClick={sendLogs}
                                color="success"
                            >
                                {t('submit')}
                            </SquaredButton>
                        </Stack>
                    )}
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
