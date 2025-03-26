import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';

import {
    AppConfig,
    BaseNodeStatus,
    CpuMinerStatus,
    GpuMinerStatus,
    NetworkStatus,
    ExternalDependency,
    WalletBalance,
} from '@app/types/app-status';
import { handleNewBlock } from '@app/store/useBlockchainVisualisationStore';

import { setGpuDevices } from '@app/store';
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
import {
    ConnectedPeersUpdatePayload,
    CriticalProblemPayload,
    DetectedAvailableGpuEngines,
    DetectedDevicesPayload,
    NewBlockHeightPayload,
    ResumingAllProcessesPayload,
    SetupStatusPayload,
    ShowReleaseNotesPayload,
    WalletAddressUpdatePayload,
} from '@app/types/events-payloads';

import {
    handleBaseNodeStatusUpdate,
    handleConnectedPeersUpdate,
    setCpuMiningStatus,
    setGpuMiningStatus,
    setWalletAddress,
    setWalletBalance,
} from '@app/store';

const BACKEND_STATE_UPDATE = 'backend_state_update';

type BackendStateUpdateEvent =
    | {
          event_type: 'WalletAddressUpdate';
          payload: WalletAddressUpdatePayload;
      }
    | {
          event_type: 'BaseNodeUpdate';
          payload: BaseNodeStatus;
      }
    | {
          event_type: 'WalletBalanceUpdate';
          payload: WalletBalance;
      }
    | {
          event_type: 'CpuMiningUpdate';
          payload: CpuMinerStatus;
      }
    | {
          event_type: 'GpuMiningUpdate';
          payload: GpuMinerStatus;
      }
    | {
          event_type: 'ConnectedPeersUpdate';
          payload: ConnectedPeersUpdatePayload;
      }
    | {
          event_type: 'NewBlockHeight';
          payload: NewBlockHeightPayload;
      }
    | {
          event_type: 'AppConfigLoaded';
          payload: AppConfig;
      }
    | {
          event_type: 'CloseSplashscreen';
          payload: undefined;
      }
    | {
          event_type: 'DetectedDevices';
          payload: DetectedDevicesPayload;
      }
    | {
          event_type: 'DetectedAvailableGpuEngines';
          payload: DetectedAvailableGpuEngines;
      }
    | {
          event_type: 'SetupStatus';
          payload: SetupStatusPayload;
      }
    | {
          event_type: 'ResumingAllProcesses';
          payload: ResumingAllProcessesPayload;
      }
    | {
          event_type: 'CriticalProblem';
          payload: CriticalProblemPayload;
      }
    | {
          event_type: 'MissingApplications';
          payload: ExternalDependency[];
      }
    | {
          event_type: 'StuckOnOrphanChain';
          payload: boolean;
      }
    | {
          event_type: 'ShowReleaseNotes';
          payload: ShowReleaseNotesPayload;
      }
    | {
          event_type: 'NetworkStatus';
          payload: NetworkStatus;
      }
    | {
          event_type: 'CorePhaseFinished';
          payload: boolean;
      }
    | {
          event_type: 'WalletPhaseFinished';
          payload: boolean;
      }
    | {
          event_type: 'HardwarePhaseFinished';
          payload: boolean;
      }
    | {
          event_type: 'RemoteNodePhaseFinished';
          payload: boolean;
      }
    | {
          event_type: 'LocalNodePhaseFinished';
          payload: boolean;
      }
    | {
          event_type: 'UnknownPhaseFinished';
          payload: boolean;
      }
    | {
          event_type: 'UnlockApp';
          payload: undefined;
      }
    | {
          event_type: 'UnlockWallet';
          payload: undefined;
      }
    | {
          event_type: 'UnlockMining';
          payload: undefined;
      };

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
                        console.log('Core phase finished', event.payload);
                        // todo handle core phase finished
                        break;
                    case 'WalletPhaseFinished':
                        console.log('Wallet phase finished', event.payload);
                        // todo handle wallet phase finished
                        break;
                    case 'HardwarePhaseFinished':
                        console.log('Hardware phase finished', event.payload);
                        // todo handle hardware phase finished
                        break;
                    case 'RemoteNodePhaseFinished':
                        console.log('Remote node phase finished', event.payload);
                        // todo handle remote node phase finished
                        break;
                    case 'LocalNodePhaseFinished':
                        console.log('Local node phase finished', event.payload);
                        // todo handle local node phase finished
                        break;
                    case 'UnknownPhaseFinished':
                        console.log('Unknown phase finished', event.payload);
                        // todo handle unknown phase finished
                        break;
                    case 'UnlockApp':
                        console.log('Unlock app', event.payload);
                        // todo handle unlock app
                        break;
                    case 'UnlockWallet':
                        console.log('Unlock wallet', event.payload);
                        // todo handle unlock wallet
                        break;
                    case 'UnlockMining':
                        console.log('Unlock mining', event.payload);
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
