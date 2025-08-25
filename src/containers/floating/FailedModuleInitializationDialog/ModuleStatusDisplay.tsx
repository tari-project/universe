import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getModuleName, getStatusColor, getStatusIcon, getStatusText } from './helpers';
import { SetupPhase } from '@app/types/events-payloads';
import { AppModule, AppModuleStatus } from '@app/store/types/setup';
import { Typography } from '@app/components/elements/Typography';
import { SquaredButton } from '@app/components/elements/buttons/SquaredButton';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { IoRefreshOutline } from 'react-icons/io5';
import {
    ModuleStatusWrapper,
    ModuleHeaderWrapper,
    ModuleInfo,
    StatusText,
    ErrorContainer,
    ErrorMessageWrapper,
    PhaseLabel,
    ErrorMessage,
    NoErrorMessage,
    ModuleActionsWrapper,
} from './styles';
import { useErrorDialogsButtonsLogic } from '@app/hooks/app/useErrorDialogsButtonsLogic';

interface ModuleStatusDisplayProps {
    module: AppModule;
    status: AppModuleStatus;
    errorMessages: Record<SetupPhase, string>;
    onRestart?: () => void;
    onSendLogs?: () => void;
    isRestartLoading?: boolean;
    allModulesFailed?: boolean;
}

export const ModuleStatusDisplay = memo(function ModuleStatusDisplay({
    module,
    status,
    errorMessages,
    onRestart,
    isRestartLoading = false,
    allModulesFailed = false,
}: ModuleStatusDisplayProps) {
    const { t } = useTranslation(['setup-progresses', 'common'], { useSuspense: false });

    const moduleName = useMemo(() => getModuleName(module), [module]);
    const statusColor = useMemo(() => getStatusColor(status), [status]);
    const statusName = useMemo(() => getStatusText(status), [status]);
    const StatusIcon = useMemo(() => getStatusIcon(status), [status]);

    const errorMessagesList = errorMessages
        ? Object.entries(errorMessages).map(([phase, message]) => ({ phase, message }))
        : [];

    const parseErrorMessage = (errorMessage: string) => {
        const regex = /failed-to-complete-step:\s*([^.]+)\.\s*Error:\s*(.*)/;
        const match = errorMessage.match(regex);
        if (match) {
            const [, initialStep, message] = match;
            const step = `title.${initialStep}`;
            return `${t('failed-to-complete-step')}: ${t(step)}. ${message}`;
        }
        return errorMessage;
    };

    const { logsSubmissionId, handleSendFeedback, handleCopyLogsSubmissionId, handleLogsButtonText } =
        useErrorDialogsButtonsLogic();

    const handleSendModuleLogs = useCallback(() => {
        handleSendFeedback(`Failed initialization of ${module}`);
    }, [handleSendFeedback, module]);

    return (
        <ModuleStatusWrapper>
            <ModuleHeaderWrapper>
                <ModuleInfo>
                    {StatusIcon}
                    <Typography variant="h6">{t(moduleName)}</Typography>
                </ModuleInfo>
                <StatusText $statusColor={statusColor}>
                    <Typography variant="p">{t(statusName)}</Typography>
                </StatusText>
            </ModuleHeaderWrapper>

            {status === AppModuleStatus.Failed && (errorMessagesList.length > 0 || !errorMessages) && (
                <ErrorContainer>
                    {errorMessagesList.length > 0 ? (
                        errorMessagesList.map((error, index) => (
                            <ErrorMessageWrapper key={index}>
                                {/* Phase label positioned on the top border */}
                                <PhaseLabel>
                                    <Typography variant="p">
                                        {t('common:phase')}: {error.phase}
                                    </Typography>
                                </PhaseLabel>
                                {/* Error message */}
                                <ErrorMessage>
                                    <Typography variant="p">{parseErrorMessage(error.message)}</Typography>
                                </ErrorMessage>
                            </ErrorMessageWrapper>
                        ))
                    ) : (
                        <NoErrorMessage>
                            <Typography variant="p">
                                • {t('common:error-details-unavailable', 'Error details not available')}
                            </Typography>
                        </NoErrorMessage>
                    )}
                </ErrorContainer>
            )}

            {status === AppModuleStatus.Failed && !allModulesFailed && (
                <ModuleActionsWrapper>
                    <SquaredButton
                        color="warning"
                        size="small"
                        onClick={logsSubmissionId ? handleCopyLogsSubmissionId : handleSendModuleLogs}
                        style={{ minWidth: '100px' }}
                    >
                        {handleLogsButtonText}
                    </SquaredButton>
                    <SquaredButton
                        color="brightGreen"
                        size="small"
                        onClick={onRestart}
                        disabled={isRestartLoading}
                        style={{ minWidth: '100px' }}
                    >
                        {isRestartLoading ? (
                            <CircularProgress />
                        ) : (
                            <>
                                <IoRefreshOutline size={16} />
                                {t('common:restart')}
                            </>
                        )}
                    </SquaredButton>
                </ModuleActionsWrapper>
            )}
        </ModuleStatusWrapper>
    );
});
