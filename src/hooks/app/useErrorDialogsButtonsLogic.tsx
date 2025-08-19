import { invoke } from '@tauri-apps/api/core';
import { useCallback, useMemo, useState } from 'react';
import { useCopyToClipboard } from '../helpers';
import { Trans, useTranslation } from 'react-i18next';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';
import { CircularProgress } from '@app/components/elements/CircularProgress';

export const useErrorDialogsButtonsLogic = (feedbackI18nKey: string) => {
    const { t } = useTranslation(['setup-progresses', 'common'], { useSuspense: false });
    const [isExiting, setIsExiting] = useState(false);
    const [isSubmittingLogs, setIsSubmittingLogs] = useState(false);
    const [logsSubmissionId, setLogsSubmissionId] = useState<string | null>(null);
    const { copyToClipboard, isCopied } = useCopyToClipboard();

    const handleClose = useCallback(async () => {
        try {
            setIsExiting(true);
            await invoke('exit_application');
        } catch (e) {
            console.error('Error closing application | handleClose in CriticalProblemDialog: ', e);
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
                feedback: t(feedbackI18nKey, { lng: 'en' }),
                includeLogs: true,
            }).then((submissionId) => {
                setLogsSubmissionId(submissionId);
            });
        } catch (e) {
            console.error('Error sending feedback| handleSendFeedback in CriticalProblemDialog: ', e);
        }
        setIsSubmittingLogs(false);
    }, [feedbackI18nKey, t]);

    const handleCopyLogsSubmissionId = useCallback(() => {
        if (logsSubmissionId) {
            copyToClipboard(logsSubmissionId);
        }
    }, [logsSubmissionId, copyToClipboard]);

    const handleLogsButtonText = useMemo(() => {
        if (logsSubmissionId) {
            return (
                <Stack direction="row" gap={4} alignItems="center">
                    <Typography variant="p"> {isCopied ? t('copied') : logsSubmissionId} </Typography>
                    {isCopied ? <IoCheckmarkOutline size={12} /> : <IoCopyOutline size={12} />}
                </Stack>
            );
        }
        return isSubmittingLogs ? <CircularProgress /> : <Trans t={t}>send-logs</Trans>;
    }, [logsSubmissionId, isSubmittingLogs, isCopied, t]);

    return {
        isExiting,
        isSubmittingLogs,
        logsSubmissionId,
        handleClose,
        handleRestart,
        handleSendFeedback,
        handleCopyLogsSubmissionId,
        handleLogsButtonText,
    };
};
