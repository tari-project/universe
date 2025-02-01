import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useWalletStore } from '@app/store/useWalletStore';
import {
    BaseNodeStatus,
    CpuMinerStatus,
    GpuMinerStatus,
    PublicDeviceParameters,
    TransactionInfo,
    WalletBalance,
} from '@app/types/app-status';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore';
import { handleNewBlock } from '@app/store/useBlockchainVisualisationStore';

const FRONTEND_EVENT = 'frontend_event';

type FrontendEvent =
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
          event_type: 'GpuDevicesUpdate';
          payload: PublicDeviceParameters[];
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
      };

const useTauriEventsListener = () => {
    const setWalletAddress = useWalletStore((s) => s.setWalletAddress);
    const setWalletBalance = useWalletStore((s) => s.setWalletBalance);
    const setGpuDevices = useMiningMetricsStore((s) => s.setGpuDevices);
    const setGpuMiningStatus = useMiningMetricsStore((s) => s.setGpuMiningStatus);
    const setCpuMiningStatus = useMiningMetricsStore((s) => s.setCpuMiningStatus);
    const handleConnectedPeersUpdate = useMiningMetricsStore((s) => s.handleConnectedPeersUpdate);
    const handleBaseNodeStatusUpdate = useMiningMetricsStore((s) => s.handleBaseNodeStatusUpdate);

    useEffect(() => {
        const unlisten = listen(FRONTEND_EVENT, ({ payload: event }: { payload: FrontendEvent }) => {
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
                case 'GpuDevicesUpdate':
                    setGpuDevices(event.payload);
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
        setGpuDevices,
        setGpuMiningStatus,
        setWalletAddress,
        setWalletBalance,
    ]);
};

export default useTauriEventsListener;
