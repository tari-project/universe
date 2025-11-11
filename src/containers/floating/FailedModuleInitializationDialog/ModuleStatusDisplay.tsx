import { ReactNode, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IoRefreshOutline } from 'react-icons/io5';
import { SetupPhase } from '@app/types/events-payloads';
import { AppModule, AppModuleStatus } from '@app/store/types/setup';
import { Typography } from '@app/components/elements/Typography';
import { getModuleName, getStatusColor, getStatusIcon, getStatusText } from './helpers';
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
import { Button } from '@app/components/elements/buttons/Button.tsx';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';

interface ModuleStatusDisplayProps {
    module: AppModule;
    status: AppModuleStatus;
    errorMessages: Record<SetupPhase, string>;
    onRestart?: () => void;
    onSendLogs?: () => void;
    isRestartLoading?: boolean;
    allModulesFailed?: boolean;
    extraActionButtons?: ReactNode[];
}

export function ModuleStatusDisplay({
    module,
    status,
    errorMessages,
    onRestart,
    isRestartLoading = false,
    allModulesFailed = false,
    extraActionButtons,
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

    const handleSendModuleLogs = useCallback(async () => {
        await handleSendFeedback(`Failed initialization of ${module}`);
    }, [handleSendFeedback, module]);

    return (
        <ModuleStatusWrapper>
            <ModuleHeaderWrapper>
                <ModuleInfo>
                    {StatusIcon}
                    <Typography>{t(moduleName)}</Typography>
                </ModuleInfo>
                <StatusText $statusColor={statusColor}>
                    <Typography>{t(statusName)}</Typography>
                </StatusText>
            </ModuleHeaderWrapper>

            {status === AppModuleStatus.Failed && (errorMessagesList.length > 0 || !errorMessages) && (
                <ErrorContainer>
                    {errorMessagesList.length > 0 ? (
                        errorMessagesList.map((error) => (
                            <ErrorMessageWrapper key={error.phase}>
                                {/* Phase label positioned on the top border */}
                                <PhaseLabel>
                                    <Typography>
                                        {t('common:phase')}: {error.phase}
                                    </Typography>
                                </PhaseLabel>
                                {/* Error message */}
                                <ErrorMessage>{parseErrorMessage(error.message)}</ErrorMessage>
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
                    {extraActionButtons}
                    <Button
                        backgroundColor="warning"
                        variant="outlined"
                        size="smaller"
                        onClick={logsSubmissionId ? handleCopyLogsSubmissionId : handleSendModuleLogs}
                    >
                        {handleLogsButtonText}
                    </Button>
                    <Button
                        backgroundColor="green"
                        size="smaller"
                        variant="outlined"
                        onClick={onRestart}
                        disabled={isRestartLoading}
                        icon={!isRestartLoading ? <IoRefreshOutline size={12} /> : null}
                        iconPosition={isRestartLoading ? 'end' : 'hug-start'}
                        isLoading={isRestartLoading}
                        loader={<LoadingDots />}
                    >
                        {t('common:restart')}
                    </Button>
                </ModuleActionsWrapper>
            )}
        </ModuleStatusWrapper>
    );
}
