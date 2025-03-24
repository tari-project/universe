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

import {
    handleBaseNodeStatusUpdate,
    handleConnectedPeersUpdate,
    setCpuMiningStatus,
    setGpuDevices,
    setGpuMiningStatus,
    setWalletAddress,
    setWalletBalance,
} from '@app/store';
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
      };
const useTauriEventsListener = () => {
    useEffect(() => {
        console.log('Listening for backend state updates');
        const unlisten = listen(
            BACKEND_STATE_UPDATE,
            async ({ payload: event }: { payload: BackendStateUpdateEvent }) => {
                console.log('Received event', event);
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
                        handleNewBlock(event.payload);
                        break;
                    case 'AppConfigLoaded':
                        handleAppConfigLoaded(event.payload);
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
                        handleSetupStatus(event.payload);
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
