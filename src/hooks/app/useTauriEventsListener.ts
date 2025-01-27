import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useWalletStore } from '@app/store/useWalletStore';
import {
    BaseNodeStatus,
    CpuMinerStatus,
    GpuMinerStatus,
    PublicDeviceParameters,
    WalletBalance,
} from '@app/types/app-status';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore';

const FRONTEND_EVENT = 'frontend_event';

enum FrontendEvent {
    WalletAddressUpdate = 'WalletAddressUpdate',
    WalletBalanceUpdate = 'WalletBalanceUpdate',
    BaseNodeUpdate = 'BaseNodeUpdate',
    GpuDevicesUpdate = 'GpuDevicesUpdate',
    CpuMiningUpdate = 'CpuMiningUpdate',
    GpuMiningUpdate = 'GpuMiningUpdate',
    ConnectedPeersUpdate = 'ConnectedPeersUpdate',
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
      };

const useTauriEventsListener = () => {
    const setWalletAddress = useWalletStore((s) => s.setWalletAddress);
    const setWalletBalance = useWalletStore((s) => s.setWalletBalance);
    const setGpuDevices = useMiningMetricsStore((s) => s.setGpuDevices);
    const setGpuMiningStatus = useMiningMetricsStore((s) => s.setGpuMiningStatus);
    const setCpuMiningStatus = useMiningMetricsStore((s) => s.setCpuMiningStatus);
    const setConnectedPeers = useMiningMetricsStore((s) => s.setConnectedPeers);
    const setBaseNodeStatus = useMiningMetricsStore((s) => s.setBaseNodeStatus);
    // {"WalletBalanceUpdate":{"balance":{"available_balance":5398127087633,"timelocked_balance":0,"pending_incoming_balance":13617687141,"pending_outgoing_balance":0}}}
    useEffect(() => {
        const unlisten = listen(FRONTEND_EVENT, ({ payload: event }: { payload: FrontendEventPayload }) => {
            switch (event.event_type) {
                case FrontendEvent.WalletAddressUpdate:
                    console.log('WalletAddressUpdate', event.payload);
                    setWalletAddress(event.payload);
                    break;
                case FrontendEvent.WalletBalanceUpdate:
                    console.log('WalletBalanceUpdate', event.payload);
                    setWalletBalance(event.payload);
                    break;
                case FrontendEvent.BaseNodeUpdate:
                    setBaseNodeStatus(event.payload);
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
                    setConnectedPeers(event.payload);
                    break;
                default:
                    console.log('Unknown event', JSON.stringify(event));
                    break;
            }
        });

        return () => {
            unlisten.then((f) => f());
        };
    }, [
        setBaseNodeStatus,
        setConnectedPeers,
        setCpuMiningStatus,
        setGpuDevices,
        setGpuMiningStatus,
        setWalletAddress,
        setWalletBalance,
    ]);
};

export default useTauriEventsListener;
