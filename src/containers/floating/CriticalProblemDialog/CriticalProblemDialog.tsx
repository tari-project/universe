import { SquaredButton } from '@app/components/elements/buttons/SquaredButton';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { useErrorDialogsButtonsLogic } from '@app/hooks/app/useErrorDialogsButtonsLogic';
import { useAppStateStore } from '@app/store/appStateStore';

import { memo } from 'react';
import { useTranslation } from 'react-i18next';

const CriticalProblemDialog = memo(function CriticalProblemDialog() {
    const { t } = useTranslation(['setup-progresses', 'common'], { useSuspense: false });
    const criticalProblem = useAppStateStore((s) => s.criticalProblem);

    const {
        isExiting,
        logsSubmissionId,
        handleClose,
        handleRestart,
        handleSendFeedback,
        handleCopyLogsSubmissionId,
        handleLogsButtonText,
    } = useErrorDialogsButtonsLogic();

    const handleFeedback = () => {
        handleSendFeedback(criticalProblem?.title || 'installation-problem');
    };

    return (
        <Dialog open={!!criticalProblem}>
            <DialogContent>
                <Stack gap={16}>
                    <Stack gap={4} style={{ maxWidth: '480px' }}>
                        <Typography variant="h4">
                            {t(criticalProblem?.title || 'common:installation-problem')}
                        </Typography>
                        <Typography variant="p" style={{ color: '#e0344e' }}>
                            {criticalProblem?.error_message}
                        </Typography>
                        <Typography variant="p">
                            {t(criticalProblem?.description || 'common:installation-problem')}
                        </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="center" gap={8}>
                        {isExiting ? (
                            <CircularProgress />
                        ) : (
                            <Stack direction="row" gap={8} justifyContent="space-between" style={{ width: '100%' }}>
                                <SquaredButton
                                    color="brightGreen"
                                    size="medium"
                                    onClick={logsSubmissionId ? handleCopyLogsSubmissionId : handleFeedback}
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
