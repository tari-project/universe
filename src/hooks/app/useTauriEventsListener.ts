import { useEffect } from 'react';
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

const useTauriEventsListener = () => {
    useEffect(() => {
        console.info('Listening for backend state updates');
        const unlisten = listen(
            BACKEND_STATE_UPDATE,
            async ({ payload: event }: { payload: BackendStateUpdateEvent }) => {
                console.info('Received event', event);
                switch (event.event_type) {
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
                    case 'SetupStatus':
                        await handleSetupStatus(event.payload);
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
                    case 'CorePhaseFinished':
                        console.info('Core phase finished', event.payload);
                        // todo handle core phase finished
                        break;
                    case 'WalletPhaseFinished':
                        console.info('Wallet phase finished', event.payload);
                        // todo handle wallet phase finished
                        break;
                    case 'HardwarePhaseFinished':
                        console.info('Hardware phase finished', event.payload);
                        // todo handle hardware phase finished
                        break;
                    case 'RemoteNodePhaseFinished':
                        console.info('Remote node phase finished', event.payload);
                        // todo handle remote node phase finished
                        break;
                    case 'LocalNodePhaseFinished':
                        console.info('Local node phase finished', event.payload);
                        // todo handle local node phase finished
                        break;
                    case 'UnknownPhaseFinished':
                        console.info('Unknown phase finished', event.payload);
                        // todo handle unknown phase finished
                        break;
                    case 'UnlockApp':
                        console.info('Unlock app', event.payload);
                        // todo handle unlock app
                        break;
                    case 'UnlockWallet':
                        console.info('Unlock wallet', event.payload);
                        // todo handle unlock wallet
                        break;
                    case 'UnlockMining':
                        console.info('Unlock mining', event.payload);
                        // todo handle unlock mining
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
