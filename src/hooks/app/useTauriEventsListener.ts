import { useEffect, useRef } from 'react';
import { emit, listen } from '@tauri-apps/api/event';

import { BACKEND_STATE_UPDATE, BackendStateUpdateEvent } from '@app/types/backend-state.ts';

import { handleNewBlock } from '@app/store/useBlockchainVisualisationStore';
import {
    handleBaseNodeStatusUpdate,
    handleConnectedPeersUpdate,
    setCpuMiningStatus,
    setGpuDevices,
    setGpuMiningStatus,
} from '@app/store/actions/miningMetricsStoreActions';
import {
    handleAskForRestart,
    handleCloseSplashscreen,
    handleConnectionStatusChanged,
    setConnectionStatus,
    setIsReconnecting,
    setShowExternalDependenciesDialog,
} from '@app/store/actions/uiStoreActions';
import { setAvailableEngines } from '@app/store/actions/miningStoreActions';
import {
    handleRestartingPhases,
    handleShowRelesaeNotes,
    loadExternalDependencies,
    setCriticalProblem,
    setCriticalProblemTest,
    setIsStuckOnOrphanChain,
    setNetworkStatus,
} from '@app/store/actions/appStateStoreActions';
import {
    refreshTransactions,
    setWalletAddress,
    setWalletBalance,
    updateWalletScanningProgress,
    useUIStore,
} from '@app/store';
import { deepEqual } from '@app/utils/objectDeepEqual.ts';
import {
    handleAppUnlocked,
    handleMiningLocked,
    handleMiningUnlocked,
    handleWalletLocked,
    handleWalletUnlocked,
} from '@app/store/actions/setupStoreActions';
import { setNodeStoreState } from '@app/store/useNodeStore';
import {
    handleConfigCoreLoaded,
    handleConfigMiningLoaded,
    handleConfigUILoaded,
    handleConfigWalletLoaded,
} from '@app/store/actions/appConfigStoreActions';
import { invoke } from '@tauri-apps/api/core';

const LOG_EVENT_TYPES = [
    // 'ResumingAllProcesses',
    // 'StuckOnOrphanChain',
    // 'MissingApplications',
    // 'CriticalProblem',
    // 'DetectedDevices',
    // 'DetectedAvailableGpuEngines',
    // 'AppConfigLoaded',
    'LockMining',
    'LockWallet',
    'UnlockMining',
    'UnlockWallet',
];

const useTauriEventsListener = () => {
    const eventRef = useRef<BackendStateUpdateEvent | null>(null);
    function handleLogUpdate(newEvent: BackendStateUpdateEvent) {
        if (LOG_EVENT_TYPES.includes(newEvent.event_type)) {
            const isEqual = deepEqual(eventRef.current, newEvent);
            if (!isEqual) {
                console.info('Received event', newEvent);
                eventRef.current = newEvent;
            }
        }
    }
    useEffect(() => {
        const setupListener = async () => {
            // Set up the event listener
            const unlisten = await listen(
                BACKEND_STATE_UPDATE,
                async ({ payload: event }: { payload: BackendStateUpdateEvent }) => {
                    handleLogUpdate(event);
                    switch (event.event_type) {
                        case 'CorePhaseFinished':
                            break;
                        case 'HardwarePhaseFinished':
                            break;
                        case 'NodePhaseFinished':
                            break;
                        case 'UnknownPhaseFinished':
                            break;
                        case 'WalletPhaseFinished':
                            break;
                        case 'UnlockApp':
                            await handleAppUnlocked();
                            break;
                        case 'UnlockWallet':
                            handleWalletUnlocked();
                            break;
                        case 'UnlockMining':
                            await handleMiningUnlocked();
                            break;
                        case 'LockMining':
                            await handleMiningLocked();
                            break;
                        case 'LockWallet':
                            handleWalletLocked();
                            break;
                        case 'WalletAddressUpdate':
                            setWalletAddress(event.payload);
                            break;
                        case 'WalletBalanceUpdate':
                            setWalletBalance(event.payload);
                            refreshTransactions();
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
                        case 'ConnectedPeersUpdate':
                            handleConnectedPeersUpdate(event.payload);
                            break;
                        case 'NewBlockHeight':
                            await handleNewBlock(event.payload);
                            break;
                        case 'ConfigCoreLoaded':
                            handleConfigCoreLoaded(event.payload);
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
                        case 'CloseSplashscreen':
                            handleCloseSplashscreen();
                            break;
                        case 'DetectedDevices':
                            setGpuDevices(event.payload.devices);
                            break;
                        case 'DetectedAvailableGpuEngines':
                            setAvailableEngines(event.payload.engines, event.payload.selected_engine);
                            break;
                        case 'CriticalProblem':
                            setCriticalProblemTest(event.payload);
                            break;
                        case 'MissingApplications':
                            loadExternalDependencies(event.payload);
                            setShowExternalDependenciesDialog(true);
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
                            handleRestartingPhases(event.payload);
                            break;
                        case 'AskForRestart':
                            handleAskForRestart();
                            break;
                        case 'BackgroundNodeSyncUpdate':
                            setNodeStoreState({
                                backgroundNodeSyncLastUpdate: event.payload,
                            });
                            break;
                        case 'InitWalletScanningProgress':
                            updateWalletScanningProgress(event.payload);
                            break;
                        case 'ConnectionStatus':
                            handleConnectionStatusChanged(event.payload);
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
        };

        let unlistenFunction: (() => void) | null = null;
        setupListener().then((unlisten) => {
            unlistenFunction = unlisten;
        });

        return () => {
            unlistenFunction?.();
        };
    }, []);
};

export default useTauriEventsListener;
