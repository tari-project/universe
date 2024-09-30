import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/tauri';

import { useUIStore } from '@app/store/useUIStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Button } from '@app/components/elements/Button.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';

import { TextArea } from '@app/components/elements/inputs/TextArea.tsx';

export function SendLogsDialog({ onSetReference }: { onSetReference?: (reference) => void }) {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const showLogsDialog = useUIStore((s) => s.showLogsDialog);
    const setShowLogsDialog = useUIStore((s) => s.setShowLogsDialog);

    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);

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
                setShowLogsDialog(false);
                onSetReference?.(r);
            })
            .catch((error) => {
                setError(error.toString());
            })
            .finally(() => {
                setLoading(false);
            });
    }, [feedback, onSetReference, setShowLogsDialog, t]);

    return (
        <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
            <DialogContent>
                <Stack direction="column" alignItems="center" justifyContent="space-between">
                    <Typography variant="h3">{t('send-logs', { ns: 'settings' })}</Typography>
                    <TextArea
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder={t('your-feedback', { ns: 'settings' })}
                        value={feedback}
                    />
                    <Typography variant={'p'} color={'red'}>
                        {error}
                    </Typography>
                    <Stack direction="row">
                        {loading ? (
                            <CircularProgress />
                        ) : (
                            <>
                                <Button disabled={loading} onClick={() => setShowLogsDialog(false)} color="warning">
                                    {t('cancel')}
                                </Button>
                                <Button
                                    disabled={loading || !feedback?.length || feedback?.trim() === ''}
                                    onClick={sendLogs}
                                >
                                    {t('submit')}
                                </Button>
                            </>
                        )}
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
