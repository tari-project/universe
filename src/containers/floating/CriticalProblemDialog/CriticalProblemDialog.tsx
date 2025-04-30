import { SquaredButton } from '@app/components/elements/buttons/SquaredButton';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { useCopyToClipboard } from '@app/hooks';
import { useAppStateStore } from '@app/store/appStateStore';
import { invoke } from '@tauri-apps/api/core';

import { memo, useCallback, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';

const CriticalProblemDialog = memo(function CriticalProblemDialog() {
    const { t } = useTranslation('setup-progresses', { useSuspense: false });
    const criticalProblem = useAppStateStore((s) => s.criticalProblem);
    const [isExiting, setIsExiting] = useState(false);
    const [isSubmittingLogs, setIsSubmittingLogs] = useState(false);
    const [logsSubmissionId, setLogsSubmissionId] = useState<string | null>(null);
    const { copyToClipboard, isCopied } = useCopyToClipboard();

    const handleClose = useCallback(async () => {
        try {
            setIsExiting(true);
            await invoke('exit_application');
        } catch (e) {
            console.error('Error closing application| handleClose in CriticalProblemDialog: ', e);
        }
        setIsExiting(false);
    }, []);

    const handleRestart = useCallback(async () => {
        try {
            setIsExiting(true);
            await invoke('restart_application', { shouldStopMiners: true });
        } catch (e) {
            console.error('Error restarting application| handleRestart in CriticalProblemDialog: ', e);
        }
        setIsExiting(false);
    }, []);

    const handleSendFeedback = useCallback(async () => {
        try {
            setIsSubmittingLogs(true);
            await invoke('send_feedback', {
                feedback: t(criticalProblem?.title || 'installation-problem', { lng: 'en' }),
                includeLogs: true,
            }).then((submissionId) => {
                setLogsSubmissionId(submissionId);
            });
        } catch (e) {
            console.error('Error sending feedback| handleSendFeedback in CriticalProblemDialog: ', e);
        }
        setIsSubmittingLogs(false);
    }, [criticalProblem?.title, t]);

    const handleCopyLogsSubmissionId = useCallback(() => {
        if (logsSubmissionId) {
            copyToClipboard(logsSubmissionId);
        }
    }, [logsSubmissionId, copyToClipboard]);

    const handleLogsButtonText = useMemo(() => {
        if (logsSubmissionId) {
            return (
                <Stack direction="row" gap={4} alignItems="center">
                    <Typography variant="p">{isCopied ? t('copied') : logsSubmissionId}</Typography>
                    {isCopied ? <IoCheckmarkOutline size={12} /> : <IoCopyOutline size={12} />}
                </Stack>
            );
        }
        return isSubmittingLogs ? <CircularProgress /> : <Trans t={t}>send-logs</Trans>;
    }, [logsSubmissionId, isSubmittingLogs, isCopied, t]);

    return (
        <Dialog
            //open={!!criticalProblem}
            open={false}
        >
            <DialogContent>
                <Stack gap={16}>
                    <Stack gap={4} style={{ maxWidth: '480px' }}>
                        <Typography variant="h4">{t(criticalProblem?.title || 'installation-problem')}</Typography>
                        <Typography variant="p">{t(criticalProblem?.description || 'installation-problem')}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="center" gap={8}>
                        {isExiting ? (
                            <CircularProgress />
                        ) : (
                            <Stack direction="row" gap={8} justifyContent="space-between" style={{ width: '100%' }}>
                                <SquaredButton
                                    color="brightGreen"
                                    size="medium"
                                    onClick={logsSubmissionId ? handleCopyLogsSubmissionId : handleSendFeedback}
                                >
                                    {handleLogsButtonText}
                                </SquaredButton>
                                <Stack direction="row" gap={8} justifyContent="space-around">
                                    <SquaredButton color="error" size="medium" onClick={handleClose}>
                                        {t('close-tari-universe')}
                                    </SquaredButton>
                                    <SquaredButton color="warning" size="medium" onClick={handleRestart}>
                                        {t('restart')}
                                    </SquaredButton>
                                </Stack>
                            </Stack>
                        )}
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
});

export default CriticalProblemDialog;
