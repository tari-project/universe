import { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';

import { BACKEND_STATE_UPDATE, BackendStateUpdateEvent } from '@app/types/backend-state.ts';

import { handleNewBlock } from '@app/store/useBlockchainVisualisationStore';
import {
    handleBaseNodeStatusUpdate,
    handleConnectedPeersUpdate,
    setCpuMiningStatus,
    setGpuDevices,
    setGpuMiningStatus,
} from '@app/store/actions/miningMetricsStoreActions';
import { handleAppConfigLoaded } from '@app/store/actions/appConfigStoreActions';
import { handleCloseSplashscreen, setShowExternalDependenciesDialog } from '@app/store/actions/uiStoreActions';
import { setAvailableEngines } from '@app/store/actions/miningStoreActions';
import {
    handleSetupStatus,
    handleShowRelesaeNotes,
    loadExternalDependencies,
    setAppResumePayload,
    setCriticalProblem,
    setIsStuckOnOrphanChain,
    setNetworkStatus,
} from '@app/store/actions/appStateStoreActions';
import { setWalletAddress, setWalletBalance } from '@app/store';
import { deepEqual } from '@app/utils/objectDeepEqual.ts';
import { setHardwarePhaseComplete, setMiningUnlocked, setSetupProgress } from '@app/store/actions/setupStoreActions.ts';

const LOG_EVENT_TYPES = [
    'ResumingAllProcesses',
    'StuckOnOrphanChain',
    'MissingApplications',
    'CriticalProblem',
    'DetectedDevices',
    'DetectedAvailableGpuEngines',
    'AppConfigLoaded',
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
        console.info('Listening for backend state updates');
        const unlisten = listen(
            BACKEND_STATE_UPDATE,
            async ({ payload: event }: { payload: BackendStateUpdateEvent }) => {
                handleLogUpdate(event);
                switch (event.event_type) {
                    case 'CorePhaseFinished':
                        if (event.payload) {
                            setSetupProgress(0.15);
                        }
                        break;

                    case 'HardwarePhaseFinished':
                        if (event.payload) {
                            setHardwarePhaseComplete(event.payload);
                            setSetupProgress(0.35);
                        }
                        break;
                    case 'RemoteNodePhaseFinished':
                        if (event.payload) {
                            setSetupProgress(0.4);
                        }
                        break;
                    case 'LocalNodePhaseFinished':
                        if (event.payload) {
                            setSetupProgress(0.45);
                        }
                        break;
                    case 'UnknownPhaseFinished':
                        if (event.payload) {
                            setSetupProgress(0.5);
                        }
                        break;
                    case 'WalletPhaseFinished':
                        if (event.payload) {
                            setSetupProgress(0.65);
                        }
                        break;
                    case 'UnlockApp':
                        console.info('Unlock app', event.payload);
                        setSetupProgress(0.9);
                        break;
                    case 'UnlockWallet':
                        console.info('Unlock wallet', event.payload);
                        setSetupProgress(0.95);
                        break;
                    case 'UnlockMining':
                        if (event.payload) {
                            console.info('Unlock mining');
                            setMiningUnlocked(true);
                            setSetupProgress(0.98);
                        }
                        break;
                    case 'SetupStatus':
                        await handleSetupStatus(event.payload);
                        break;
                    case 'WalletAddressUpdate':
                        setWalletAddress(event.payload);
                        break;
                    case 'WalletBalanceUpdate':
                        setWalletBalance(event.payload);
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
                    case 'AppConfigLoaded':
                        await handleAppConfigLoaded(event.payload);
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

                    case 'ResumingAllProcesses':
                        setAppResumePayload(event.payload);
                        break;
                    case 'CriticalProblem':
                        setCriticalProblem(event.payload);
                        break;
                    case 'MissingApplications':
                        loadExternalDependencies(event.payload);
                        setShowExternalDependenciesDialog(true);
                        break;
                    case 'StuckOnOrphanChain':
                        setIsStuckOnOrphanChain(event.payload);
                        break;
                    case 'ShowReleaseNotes':
                        handleShowRelesaeNotes(event.payload);
                        break;
                    case `NetworkStatus`:
                        setNetworkStatus(event.payload);
                        break;
                    default:
                        console.warn('Unknown event', JSON.stringify(event));
                        break;
                }
            }
        );

        return () => {
            unlisten.then((f) => f());
        };
    }, []);
};

export default useTauriEventsListener;
