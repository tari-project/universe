import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';

import {
    AppConfig,
    BaseNodeStatus,
    CpuMinerStatus,
    GpuDevice,
    GpuMinerStatus,
    NetworkStatus,
    TransactionInfo,
    WalletBalance,
} from '@app/types/app-status';
import { handleNewBlock } from '@app/store/useBlockchainVisualisationStore';
import { setNetworkStatus } from '@app/store/actions/appStateStoreActions';

import {
    handleBaseNodeStatusUpdate,
    handleConnectedPeersUpdate,
    setCpuMiningStatus,
    setGpuMiningStatus,
    setWalletAddress,
    setWalletBalance,
} from '@app/store';
import { handleAppConfigLoaded } from '@app/store/actions/appConfigStoreActions';
import { handleCloseSplashscreen } from '@app/store/actions/uiStoreActions';
import { setAvailableEngines } from '@app/store/actions/miningStoreActions';

const BACKEND_STATE_UPDATE = 'backend_state_update';

type BackendStateUpdateEvent =
    | {
          event_type: 'WalletAddressUpdate';
          payload: {
              tari_address_base58: string;
              tari_address_emoji: string;
          };
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
          payload: string[];
      }
    | {
          event_type: 'NewBlockHeight';
          payload: {
              block_height: number;
              coinbase_transaction?: TransactionInfo;
              balance: WalletBalance;
          };
      }
    | {
          event_type: 'AppConfigLoaded';
          payload: AppConfig;
      }
    | {
          event_type: 'CloseSplashscreen';
          payload: any;
      }
    | {
          event_type: 'DetectedDevices';
          payload: {
              devices: GpuDevice[];
          };
      }
    | {
          event_type: 'DetectedAvailableGpuEngines';
          payload: {
              engines: string[];
              selected_engine: string;
          };
      }
    | {
          event_type: 'NetworkStatus';
          payload: NetworkStatus;
      };
const useTauriEventsListener = () => {
    useEffect(() => {
        console.log('Listening for backend state updates');
        const unlisten = listen(BACKEND_STATE_UPDATE, ({ payload: event }: { payload: BackendStateUpdateEvent }) => {
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
                case `NetworkStatus`:
                    setNetworkStatus(event.payload);
                    break;
                default:
                    console.warn('Unknown event', JSON.stringify(event));
                    break;
            }
        });

        return () => {
            unlisten.then((f) => f());
        };
    }, []);
};

export default useTauriEventsListener;
