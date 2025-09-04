import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import { IoRefreshOutline, IoCloseOutline } from 'react-icons/io5';

import { Button } from '@app/components/elements/buttons/Button';
import { Typography } from '@app/components/elements/Typography';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';

import { useErrorDialogsButtonsLogic } from '@app/hooks/app/useErrorDialogsButtonsLogic';
import { setupStoreSelectors } from '@app/store/selectors/setupStoreSelectors';
import { useSetupStore } from '@app/store/useSetupStore';
import { useUIStore } from '@app/store/useUIStore';
import { setDialogToShow } from '@app/store/actions/uiStoreActions';
import { AppModule, AppModuleState, AppModuleStatus } from '@app/store/types/setup';

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

export default function FailedModuleInitializationDialog() {
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

    const handleFeedbackForAllModules = useCallback(async () => {
        await handleSendFeedback('Failed initialization of all modules');
    }, [handleSendFeedback]);

    const handleCloseDialog = useCallback(() => {
        setIsDialogOpen(false);
        if (isDialogTriggered) {
            setDialogToShow(null);
        }
    }, [isDialogTriggered]);

    return (
        <Dialog open={shouldShowDialog} onOpenChange={canClose ? handleCloseDialog : undefined}>
            <DialogContent>
                {canClose && (
                    <CloseButton onClick={handleCloseDialog}>
                        <IoCloseOutline size={16} />
                    </CloseButton>
                )}

                <DialogWrapper>
                    <HeaderWrapper>
                        <Typography variant="h3">
                            {allModulesFailed
                                ? t('setup-progresses:critical-initialization-failure')
                                : t('setup-progresses:module-initialization-issues')}
                        </Typography>
                    </HeaderWrapper>

                    <DescriptionText $allModulesFailed={allModulesFailed}>
                        <Typography>
                            {allModulesFailed
                                ? t('setup-progresses:all-modules-failed-description')
                                : t('setup-progresses:some-modules-failed-description')}
                        </Typography>
                    </DescriptionText>

                    {/* Module Status List - Scrollable */}
                    <ModuleListWrapper>
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
                                        ? [<GpuMiningModuleMissingPackagesButton key="gpu-mining-missing-packages" />]
                                        : undefined
                                }
                            />
                        ))}
                    </ModuleListWrapper>

                    {/* Global Actions */}
                    {allModulesFailed && (
                        <GlobalActionsWrapper>
                            {isExiting ? (
                                <CircularProgress />
                            ) : (
                                <>
                                    <Button
                                        variant="outlined"
                                        fluid
                                        backgroundColor="error"
                                        size="small"
                                        onClick={handleClose}
                                    >
                                        {t('common:close-tari-universe')}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        fluid
                                        backgroundColor="green"
                                        size="small"
                                        onClick={handleRestart}
                                        icon={<IoRefreshOutline size={12} />}
                                        iconPosition="hug-start"
                                    >
                                        {t('common:restart')}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        fluid
                                        backgroundColor="warning"
                                        size="small"
                                        onClick={handleFeedbackForAllModules}
                                    >
                                        {handleSeperateLogsButtonText}
                                    </Button>
                                </>
                            )}
                            {logsSubmissionId && (
                                <Button
                                    backgroundColor="gothic"
                                    variant="outlined"
                                    fluid
                                    size="small"
                                    onClick={handleCopyLogsSubmissionId}
                                >
                                    {handleLogsSubbmissionIdButtonText}
                                </Button>
                            )}
                        </GlobalActionsWrapper>
                    )}
                </DialogWrapper>
            </DialogContent>
        </Dialog>
    );
}
