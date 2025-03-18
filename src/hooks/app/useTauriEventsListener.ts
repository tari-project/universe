import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useWalletStore } from '@app/store/useWalletStore';
import {
    BaseNodeStatus,
    CpuMinerStatus,
    GpuMinerStatus,
    NetworkStatus,
    TransactionInfo,
    WalletBalance,
} from '@app/types/app-status';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore';
import { handleNewBlock } from '@app/store/useBlockchainVisualisationStore';
import { setNetworkStatus } from '@app/store/actions/appStateStoreActions';

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
          event_type: 'NetworkStatus';
          payload: NetworkStatus;
      };

const useTauriEventsListener = () => {
    const setWalletAddress = useWalletStore((s) => s.setWalletAddress);
    const setWalletBalance = useWalletStore((s) => s.setWalletBalance);
    const setGpuMiningStatus = useMiningMetricsStore((s) => s.setGpuMiningStatus);
    const setCpuMiningStatus = useMiningMetricsStore((s) => s.setCpuMiningStatus);
    const handleConnectedPeersUpdate = useMiningMetricsStore((s) => s.handleConnectedPeersUpdate);
    const handleBaseNodeStatusUpdate = useMiningMetricsStore((s) => s.handleBaseNodeStatusUpdate);

    useEffect(() => {
        const unlisten = listen(BACKEND_STATE_UPDATE, ({ payload: event }: { payload: BackendStateUpdateEvent }) => {
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
