import { useCallback, useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';

import { useUIStore } from '@app/store/useUIStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { TextArea } from '@app/components/elements/inputs/TextArea.tsx';
import { setDialogToShow } from '@app/store';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';

export function SendLogsDialog({ onSetReference }: { onSetReference?: (reference: string) => void }) {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const [isPending, startTransition] = useTransition();
    const dialogToShow = useUIStore((s) => s.dialogToShow);

    const showLogsDialog = dialogToShow === 'logs';

    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('');

    const setShowLogsDialog = useCallback(() => {
        if (showLogsDialog) {
            setDialogToShow(null);
        } else {
            setDialogToShow('logs');
        }
    }, [showLogsDialog]);

    const sendLogsActions = useCallback(async () => {
        setError('');
        if (!feedback) {
            setError(t('feedback-required', { ns: 'settings' }));
            return;
        }

        await invoke('send_feedback', { feedback, includeLogs: true })
            .then((r) => {
                setDialogToShow(null);
                onSetReference?.(r);
            })
            .catch((error) => {
                console.error('Error sending feedback: ', error);
                setError(error.toString());
            });
    }, [feedback, onSetReference, t]);

    return (
        <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
            <DialogContent>
                <Stack
                    direction="column"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={20}
                    style={{ padding: 10 }}
                >
                    <Typography variant="h3">{t('send-logs', { ns: 'settings' })}</Typography>
                    <TextArea
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder={t('your-feedback', { ns: 'settings' })}
                        minWidth="500px"
                        minHeight="200px"
                        disabled={isPending}
                        value={feedback}
                    />
                    <Typography variant={'p'} color={'red'}>
                        {error}
                    </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" style={{ width: '100%' }}>
                    <Stack direction="row" alignItems="center" gap={10} style={{ width: '80%' }}>
                        <Button onClick={setShowLogsDialog} fluid>
                            {t('cancel')}
                        </Button>
                        <Button
                            onClick={() => {
                                startTransition(async () => {
                                    await sendLogsActions();
                                });
                            }}
                            disabled={isPending || !feedback?.length || feedback?.trim() === ''}
                            loader={<LoadingDots />}
                            isLoading={isPending}
                            variant="outlined"
                            fluid
                        >
                            {t('submit')}
                        </Button>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
