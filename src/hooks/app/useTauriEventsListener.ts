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

enum FrontendEvent {
    WalletAddressUpdate = 'WalletAddressUpdate',
    WalletBalanceUpdate = 'WalletBalanceUpdate',
    BaseNodeUpdate = 'BaseNodeUpdate',
    GpuDevicesUpdate = 'GpuDevicesUpdate',
    CpuMiningUpdate = 'CpuMiningUpdate',
    GpuMiningUpdate = 'GpuMiningUpdate',
    ConnectedPeersUpdate = 'ConnectedPeersUpdate',
    NewBlockHeight = 'NewBlockHeight',
}

type FrontendEventPayload =
    | {
          event_type: FrontendEvent.WalletAddressUpdate;
          payload: {
              tari_address_base58: string;
              tari_address_emoji: string;
          };
      }
    | {
          event_type: FrontendEvent.BaseNodeUpdate;
          payload: BaseNodeStatus;
      }
    | {
          event_type: FrontendEvent.WalletBalanceUpdate;
          payload: WalletBalance;
      }
    | {
          event_type: FrontendEvent.GpuDevicesUpdate;
          payload: PublicDeviceParameters[];
      }
    | {
          event_type: FrontendEvent.CpuMiningUpdate;
          payload: CpuMinerStatus;
      }
    | {
          event_type: FrontendEvent.GpuMiningUpdate;
          payload: GpuMinerStatus;
      }
    | {
          event_type: FrontendEvent.ConnectedPeersUpdate;
          payload: string[];
      }
    | {
          event_type: FrontendEvent.NewBlockHeight;
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
        const unlisten = listen(FRONTEND_EVENT, ({ payload: event }: { payload: FrontendEventPayload }) => {
            switch (event.event_type) {
                case FrontendEvent.WalletAddressUpdate:
                    setWalletAddress(event.payload);
                    break;
                case FrontendEvent.WalletBalanceUpdate:
                    setWalletBalance(event.payload);
                    break;
                case FrontendEvent.BaseNodeUpdate:
                    handleBaseNodeStatusUpdate(event.payload);
                    break;
                case FrontendEvent.GpuDevicesUpdate:
                    setGpuDevices(event.payload);
                    break;
                case FrontendEvent.GpuMiningUpdate:
                    setGpuMiningStatus(event.payload);
                    break;
                case FrontendEvent.CpuMiningUpdate:
                    setCpuMiningStatus(event.payload);
                    break;
                case FrontendEvent.ConnectedPeersUpdate:
                    handleConnectedPeersUpdate(event.payload);
                    break;
                case FrontendEvent.NewBlockHeight:
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
