import { SquaredButton } from '@app/components/elements/buttons/SquaredButton';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { useErrorDialogsButtonsLogic } from '@app/hooks/app/useErrorDialogsButtonsLogic';
import { useAppStateStore } from '@app/store/appStateStore';

import { memo } from 'react';
import { useTranslation } from 'react-i18next';

const CriticalSetupFailure = memo(function CriticalSetupFailure() {
    const { t } = useTranslation(['setup-progresses', 'common'], { useSuspense: false });

    const {
        isExiting,
        logsSubmissionId,
        handleClose,
        handleRestart,
        handleSendFeedback,
        handleCopyLogsSubmissionId,
        handleLogsButtonText,
    } = useErrorDialogsButtonsLogic('critical-setup-failure');

    return (
        <Dialog open={!!true}>
            <DialogContent>{'Critical Setup Failure Dialog Content'}</DialogContent>
        </Dialog>
    );
});

export default CriticalSetupFailure;
