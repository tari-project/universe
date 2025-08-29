import { SquaredButton } from '@app/components/elements/buttons/SquaredButton';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { useErrorDialogsButtonsLogic } from '@app/hooks/app/useErrorDialogsButtonsLogic';
import { setupStoreSelectors } from '@app/store/selectors/setupStoreSelectors';
import { useSetupStore } from '@app/store/useSetupStore';
import { useUIStore } from '@app/store/useUIStore';
import { setDialogToShow } from '@app/store/actions/uiStoreActions';
import { AppModule, AppModuleState, AppModuleStatus } from '@app/store/types/setup';

import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IoRefreshOutline, IoCloseOutline } from 'react-icons/io5';
import { invoke } from '@tauri-apps/api/core';
import { ModuleStatusDisplay } from './ModuleStatusDisplay';
import {
    CloseButton,
    DialogWrapper,
    HeaderWrapper,
    DescriptionText,
    ModuleListWrapper,
    GlobalActionsWrapper,
} from './styles';
import { GpuMiningModuleMissingPackagesButton } from './ExtraButtons';

const FailedModuleInitializationDialog = memo(function FailedModuleInitializationDialog() {
    const { t } = useTranslation(['setup-progresses', 'common'], { useSuspense: false });
    const [restartingModule, setRestartingModule] = useState(false);

    // Check if dialog should be shown from UI store
    const dialogToShow = useUIStore((s) => s.dialogToShow);
    const isDialogTriggered = dialogToShow === 'failedModuleInitialization';

    // We want to show the dialog only if at least one module has failed and all modules have been resolved. So it will appear only once
    const isEveryAppModuleResolved = useSetupStore(setupStoreSelectors.isEveryModuleResolved);
    const isAnyModuleFailed = useSetupStore(setupStoreSelectors.isAnyModuleFailed);
    const [isDialogOpen, setIsDialogOpen] = useState(true);

    // Show dialog if triggered manually OR if conditions are met for automatic showing
    const shouldShowDialog =
        isDialogTriggered || (isAnyModuleFailed && (isEveryAppModuleResolved || restartingModule) && isDialogOpen);

    const cpuMiningModule = useSetupStore(setupStoreSelectors.selectCpuMiningModule);
    const gpuMiningModule = useSetupStore(setupStoreSelectors.selectGpuMiningModule);
    const walletModule = useSetupStore(setupStoreSelectors.selectWalletModule);

    const modules = [cpuMiningModule, gpuMiningModule, walletModule];
    const failedModules = modules.filter((module) => module.status === AppModuleStatus.Failed);
    const allModulesFailed = failedModules.length === modules.length;
    const canClose = !allModulesFailed;

    useEffect(() => {
        if (isEveryAppModuleResolved) {
            setRestartingModule(false);
        }
    }, [isEveryAppModuleResolved]);

    const {
        isExiting,
        logsSubmissionId,
        handleClose,
        handleRestart,
        handleSendFeedback,
        handleCopyLogsSubmissionId,
        handleLogsSubbmissionIdButtonText,
        handleSeperateLogsButtonText,
    } = useErrorDialogsButtonsLogic();

    const handleRestartModule = useCallback(async (appModuleState: AppModuleState) => {
        setRestartingModule(true);
        await invoke('restart_phases', { phases: Object.keys(appModuleState.error_messages) });
    }, []);

    const handleFeedbackForAllModules = useCallback(() => {
        handleSendFeedback('Failed initialization of all modules');
    }, [handleSendFeedback]);

    const handleCloseDialog = useCallback(() => {
        setIsDialogOpen(false);
        if (isDialogTriggered) {
            setDialogToShow(null);
        }
    }, [isDialogTriggered]);

    return (
        <Dialog open={shouldShowDialog} onOpenChange={canClose ? handleCloseDialog : undefined}>
            <DialogContent style={{ position: 'relative' }}>
                {/* Close button - positioned absolutely in top right corner of dialog */}
                {canClose && (
                    <CloseButton onClick={handleCloseDialog}>
                        <IoCloseOutline size={16} />
                    </CloseButton>
                )}

                <DialogWrapper>
                    {/* Header */}
                    <HeaderWrapper>
                        <Stack direction="row" justifyContent="flex-start" alignItems="center">
                            <Typography variant="h3">
                                {allModulesFailed
                                    ? t('setup-progresses:critical-initialization-failure')
                                    : t('setup-progresses:module-initialization-issues')}
                            </Typography>
                        </Stack>
                    </HeaderWrapper>

                    {/* Description */}
                    <DescriptionText $allModulesFailed={allModulesFailed}>
                        <Typography variant="p">
                            {allModulesFailed
                                ? t('setup-progresses:all-modules-failed-description')
                                : t('setup-progresses:some-modules-failed-description')}
                        </Typography>
                    </DescriptionText>

                    {/* Module Status List - Scrollable */}
                    <ModuleListWrapper>
                        <Stack gap={12}>
                            {modules.map((module) => (
                                <ModuleStatusDisplay
                                    key={module.module}
                                    module={module.module}
                                    status={module.status}
                                    errorMessages={module.error_messages}
                                    onRestart={() => handleRestartModule(module)}
                                    isRestartLoading={
                                        module.status === AppModuleStatus.Initializing ||
                                        module.status === AppModuleStatus.NotInitialized
                                    }
                                    allModulesFailed={allModulesFailed}
                                    extraActionButtons={
                                        module.module === AppModule.GpuMining
                                            ? [
                                                  <GpuMiningModuleMissingPackagesButton key="gpu-mining-missing-packages" />,
                                              ]
                                            : undefined
                                    }
                                />
                            ))}
                        </Stack>
                    </ModuleListWrapper>

                    {/* Global Actions */}
                    {allModulesFailed && (
                        <GlobalActionsWrapper>
                            <Stack>
                                <Stack direction="row" justifyContent="center" gap={12}>
                                    {isExiting ? (
                                        <CircularProgress />
                                    ) : (
                                        <>
                                            <SquaredButton
                                                color="error"
                                                size="medium"
                                                onClick={handleClose}
                                                style={{ minWidth: '120px' }}
                                            >
                                                {t('common:close-tari-universe')}
                                            </SquaredButton>
                                            <SquaredButton
                                                color="brightGreen"
                                                size="medium"
                                                onClick={handleRestart}
                                                style={{ minWidth: '120px' }}
                                            >
                                                <IoRefreshOutline size={16} />
                                                {t('common:restart')}
                                            </SquaredButton>
                                            <SquaredButton
                                                color="warning"
                                                size="medium"
                                                onClick={handleFeedbackForAllModules}
                                                style={{ minWidth: '120px' }}
                                            >
                                                {handleSeperateLogsButtonText}
                                            </SquaredButton>
                                        </>
                                    )}
                                </Stack>
                                {logsSubmissionId && (
                                    <Stack direction="row" justifyContent="center" gap={8} style={{ marginTop: '8px' }}>
                                        <SquaredButton
                                            color="gothic"
                                            size="medium"
                                            onClick={handleCopyLogsSubmissionId}
                                            style={{ width: 'auto' }}
                                        >
                                            {handleLogsSubbmissionIdButtonText}
                                        </SquaredButton>
                                    </Stack>
                                )}
                            </Stack>
                        </GlobalActionsWrapper>
                    )}
                </DialogWrapper>
            </DialogContent>
        </Dialog>
    );
});

export default FailedModuleInitializationDialog;
