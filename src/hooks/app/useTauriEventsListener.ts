import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useWalletStore } from '@app/store/useWalletStore';
import { AppConfig, BaseNodeStatus, CpuMinerStatus, GpuMinerStatus, WalletBalance } from '@app/types/app-status';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore';
import { handleNewBlock } from '@app/store/useBlockchainVisualisationStore';
import { handleAppConfigLoaded } from '@app/store/actions/appConfigStoreActions';
import { handleCloseSplashscreen } from '@app/store/actions/uiStoreActions';
import { setAvailableEngines } from '@app/store/actions/miningStoreActions';
import { handleSetupStatus, setAppResumePayload } from '@app/store/actions/appStateStoreActions';
import {
    ConnectedPeersUpdatePayload,
    DetectedAvailableGpuEngines,
    DetectedDevicesPayload,
    NewBlockHeightPayload,
    ResumingAllProcessesPayload,
    SetupStatusPayload,
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
      };
const useTauriEventsListener = () => {
    const setWalletAddress = useWalletStore((s) => s.setWalletAddress);
    const setWalletBalance = useWalletStore((s) => s.setWalletBalance);
    const setGpuMiningStatus = useMiningMetricsStore((s) => s.setGpuMiningStatus);
    const setCpuMiningStatus = useMiningMetricsStore((s) => s.setCpuMiningStatus);
    const handleConnectedPeersUpdate = useMiningMetricsStore((s) => s.handleConnectedPeersUpdate);
    const handleBaseNodeStatusUpdate = useMiningMetricsStore((s) => s.handleBaseNodeStatusUpdate);
    const setGpuDevices = useMiningMetricsStore((state) => state.setGpuDevices);

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
                    default:
                        console.warn('Unknown event', JSON.stringify(event));
                        break;
                }
            }
        );

        return () => {
            unlisten.then((f) => f());
        };
    }, [
        handleBaseNodeStatusUpdate,
        handleConnectedPeersUpdate,
        setCpuMiningStatus,
        setGpuMiningStatus,
        setWalletAddress,
        setWalletBalance,
    ]);
};

export default useTauriEventsListener;
