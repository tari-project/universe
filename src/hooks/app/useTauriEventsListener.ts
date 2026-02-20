import { useCallback, useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';

import { BACKEND_STATE_UPDATE, BackendStateUpdateEvent } from '@app/types/backend-state.ts';

import { handleNewBlockPayload, useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore';
import { setCpuMiningStatus, setGpuDevices, setGpuMiningStatus } from '@app/store/actions/miningMetricsStoreActions';
import {
    handleAskForRestart,
    handleCloseSplashscreen,
    handleConnectionStatusChanged,
    setConnectionStatus,
    setDialogToShow,
    setIsShuttingDown,
    setShouldShowExchangeSpecificModal,
    setShowBatteryAlert,
    setShowShutdownSelectionModal,
    setSidebarOpen,
} from '@app/store/actions/uiStoreActions';
import {
    handleAvailableMinersChanged,
    handleCpuMinerControlsStateChanged,
    handleGpuMinerControlsStateChanged,
    handleSelectedMinerChanged,
    setShowEcoAlert,
} from '@app/store/actions/miningStoreActions';
import {
    handleRestartingPhases,
    handleShowRelesaeNotes,
    loadSystemDependencies,
    handleCriticalProblemEvent,
    setCriticalError,
    setIsStuckOnOrphanChain,
    setNetworkStatus,
    setIsSettingsOpen,
    handleSystrayAppShutdownRequested,
} from '@app/store/actions/appStateStoreActions';
import {
    handleBaseNodeStatusUpdate,
    setWalletBalance,
    updateWalletScanningProgress,
    useSecurityStore,
} from '@app/store';
import { deepEqual } from '@app/utils/objectDeepEqual.ts';
import {
    handleAppLoaded,
    handleAppModulesUpdate,
    handleUpdateDisabledPhases,
    setInitialSetupFinished,
    updateSetupProgress,
} from '@app/store/actions/setupStoreActions';
import { setBackgroundNodeState, setNodeStoreState, setTorEntryGuards } from '@app/store/useNodeStore';
import {
    handleExchangeIdChanged,
    handleConfigMcpLoaded,
    handleConfigMiningLoaded,
    handleConfigUILoaded,
    handleConfigWalletLoaded,
    handleWalletUIChanged,
    handleConfigPoolsLoaded,
    handleGpuDevicesSettingsUpdated,
} from '@app/store/actions/appConfigStoreActions';
import {
    setMcpServerStatus,
    addMcpAuditEntry,
    setMcpPendingTransaction,
    handleMcpTransactionResult,
} from '@app/store/useMcpStore';
import { invoke } from '@tauri-apps/api/core';

import { setCpuPoolStats, setGpuPoolStats } from '@app/store/actions/miningPoolsStoreActions';
import {
    handleWalletTransactionsFound,
    handlePinLocked,
    handleSeedBackedUp,
    handleSelectedTariAddressChange,
    handleWalletTransactionsCleared,
    handleWalletTransactionUpdated,
} from '@app/store/actions/walletStoreActions';
import { handleConfigCoreLoaded } from '@app/store/actions/config/core.ts';
import { handleFeedbackExitSurveyRequested } from '@app/store/stores/userFeedbackStore';

const LOG_EVENT_TYPES = ['WalletAddressUpdate', 'CriticalProblem', 'MissingApplications'];

const useTauriEventsListener = () => {
    const initializationRef = useRef(false);
    const eventRef = useRef<BackendStateUpdateEvent | null>(null);
    function handleLogUpdate(newEvent: BackendStateUpdateEvent) {
        if (LOG_EVENT_TYPES.includes(newEvent.event_type)) {
            const isEqual = deepEqual(eventRef.current, newEvent);
            if (!isEqual) {
                console.info(newEvent.event_type, newEvent.payload);
                eventRef.current = newEvent;
            }
        }
    }

    const setupListener = useCallback(async () => {
        // Set up the event listener
        const unlisten = await listen(
            BACKEND_STATE_UPDATE,
            async ({ payload: event }: { payload: BackendStateUpdateEvent }) => {
                handleLogUpdate(event);
                switch (event.event_type) {
                    case 'UpdateAppModuleStatus':
                        await handleAppModulesUpdate(event.payload);
                        break;
                    case 'SetupProgressUpdate':
                        updateSetupProgress(event.payload);
                        break;
                    case 'UpdateTorEntryGuards':
                        setTorEntryGuards(event.payload);
                        break;
                    case 'InitialSetupFinished':
                        setInitialSetupFinished(true);
                        break;
                    case 'WalletBalanceUpdate':
                        await setWalletBalance(event.payload);
                        break;
                    case 'BaseNodeUpdate':
                        handleBaseNodeStatusUpdate(event.payload);
                        break;
                    case 'GpuMiningUpdate':
                        setGpuMiningStatus(event.payload);
                        break;
                    case 'CpuMiningUpdate':
                        setCpuMiningStatus(event.payload);
                        break;
                    case 'CpuPoolsStatsUpdate':
                        setCpuPoolStats(event.payload);
                        break;
                    case 'GpuPoolsStatsUpdate':
                        setGpuPoolStats(event.payload);
                        break;
                    case 'NewBlockHeight': {
                        const current = useBlockchainVisualisationStore.getState().latestBlockHeight;
                        if (!current || current < event.payload.block_height) {
                            await handleNewBlockPayload(event.payload.block_height);
                        }
                        break;
                    }
                    case 'ConfigCoreLoaded':
                        await handleConfigCoreLoaded(event.payload);
                        break;
                    case 'ConfigWalletLoaded':
                        handleConfigWalletLoaded(event.payload);
                        break;
                    case 'ConfigMiningLoaded':
                        handleConfigMiningLoaded(event.payload);
                        break;
                    case 'ConfigUILoaded':
                        await handleConfigUILoaded(event.payload);
                        break;
                    case 'ConfigPoolsLoaded':
                        handleConfigPoolsLoaded(event.payload);
                        break;
                    case 'ConfigMcpLoaded':
                        handleConfigMcpLoaded(event.payload);
                        break;
                    case 'McpServerStatusUpdate':
                        setMcpServerStatus(event.payload.running, event.payload.port ?? null);
                        break;
                    case 'McpTransactionConfirmation':
                        setMcpPendingTransaction(event.payload);
                        break;
                    case 'McpTransactionResult':
                        handleMcpTransactionResult(event.payload);
                        break;
                    case 'McpAuditEntry':
                        addMcpAuditEntry(event.payload);
                        break;
                    case 'CloseSplashscreen':
                        //TODO find better place for this
                        await handleAppLoaded();
                        setSidebarOpen(true);
                        handleCloseSplashscreen();
                        break;
                    case 'DetectedDevices':
                        setGpuDevices(event.payload.devices);
                        break;
                    case 'UpdateSelectedMiner':
                        handleSelectedMinerChanged(event.payload);
                        break;
                    case 'AvailableMiners':
                        handleAvailableMinersChanged(event.payload);
                        break;
                    case 'CriticalProblem': {
                        const isMacAppFolderError =
                            event.payload.title === 'common:installation-problem' &&
                            event.payload.description === 'common:not-installed-in-applications-directory';

                        if (isMacAppFolderError) {
                            setCriticalError(event.payload);
                        } else {
                            handleCriticalProblemEvent(event.payload);
                        }
                        break;
                    }
                    case 'SystemDependenciesLoaded':
                        loadSystemDependencies(event.payload);
                        break;
                    case 'StuckOnOrphanChain':
                        setIsStuckOnOrphanChain(event.payload);
                        if (event.payload) {
                            setConnectionStatus('disconnected');
                        }
                        break;
                    case 'ShowReleaseNotes':
                        handleShowRelesaeNotes(event.payload);
                        break;
                    case `NetworkStatus`:
                        setNetworkStatus(event.payload);
                        break;
                    case `NodeTypeUpdate`:
                        setNodeStoreState(event.payload);
                        break;
                    case 'RestartingPhases':
                        await handleRestartingPhases(event.payload);
                        break;
                    case 'AskForRestart':
                        handleAskForRestart();
                        break;
                    case 'BackgroundNodeSyncUpdate':
                        setBackgroundNodeState(event.payload);
                        break;
                    case 'WalletScanningProgressUpdate':
                        updateWalletScanningProgress(event.payload);
                        break;
                    case 'ConnectionStatus':
                        handleConnectionStatusChanged(event.payload);
                        break;
                    case 'ExchangeIdChanged':
                        await handleExchangeIdChanged(event.payload);
                        break;
                    case 'DisabledPhases':
                        handleUpdateDisabledPhases(event.payload);
                        break;
                    case 'SelectedTariAddressChanged':
                        handleSelectedTariAddressChange(event.payload);
                        break;
                    case 'WalletUIModeChanged':
                        handleWalletUIChanged(event.payload);
                        break;
                    case 'ShouldShowExchangeMinerModal':
                        setShouldShowExchangeSpecificModal(true);
                        break;
                    case 'ShowKeyringDialog':
                        setDialogToShow('keychain');
                        break;
                    case 'CreatePin':
                        useSecurityStore.setState({ modal: 'create_pin' });
                        break;
                    case 'EnterPin':
                        useSecurityStore.setState({ modal: 'enter_pin' });
                        break;
                    case 'UpdateGpuDevicesSettings':
                        handleGpuDevicesSettingsUpdated(event.payload);
                        break;
                    case 'PinLocked':
                        handlePinLocked(event.payload);
                        break;
                    case 'SeedBackedUp':
                        handleSeedBackedUp(event.payload);
                        break;
                    case 'UpdateCpuMinerControlsState':
                        handleCpuMinerControlsStateChanged(event.payload);
                        break;
                    case 'UpdateGpuMinerControlsState':
                        handleGpuMinerControlsStateChanged(event.payload);
                        break;
                    case 'OpenSettings':
                        setIsSettingsOpen(true);
                        break;
                    case 'SystrayAppShutdownRequested':
                        handleSystrayAppShutdownRequested();
                        break;
                    case 'ShowEcoAlert':
                        setShowEcoAlert(true);
                        break;
                    case 'FeedbackSurveyRequested':
                        await handleFeedbackExitSurveyRequested();
                        break;
                    case 'ShutdownModeSelectionRequested':
                        setShowShutdownSelectionModal(true);
                        break;
                    case 'ShuttingDown':
                        setIsShuttingDown(true);
                        break;
                    case 'WalletTransactionsFound':
                        await handleWalletTransactionsFound(event.payload);
                        break;
                    case 'WalletTransactionsCleared':
                        handleWalletTransactionsCleared();
                        break;
                    case 'WalletTransactionUpdated':
                        await handleWalletTransactionUpdated(event.payload);
                        break;
                    case 'SetShowBatteryAlert':
                        setShowBatteryAlert(event.payload);
                        break;
                    default:
                        console.warn('Unknown event', JSON.stringify(event));
                        break;
                }
            }
        );

        try {
            await invoke('frontend_ready');
            console.info('Successfully called frontend_ready');
        } catch (e) {
            console.error('Failed to call frontend_ready: ', e);
        }

        return unlisten;
    }, []);

    useEffect(() => {
        console.info('Setting up Tauri event listener for backend state updates');
        if (initializationRef.current) return;
        initializationRef.current = true;

        let unlistenFunction: (() => void) | null = null;
        setupListener().then((unlisten) => {
            unlistenFunction = unlisten;
        });

        return () => {
            unlistenFunction?.();
        };
    }, [setupListener]);
};

export default useTauriEventsListener;
