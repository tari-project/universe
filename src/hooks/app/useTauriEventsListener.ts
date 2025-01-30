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
import { handleNewBlock, useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore';
import { setAnimationState } from '@app/visuals';
import { useMiningStore } from '@app/store/useMiningStore';

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
          };
      };

const useTauriEventsListener = () => {
    const setWalletAddress = useWalletStore((s) => s.setWalletAddress);
    const setWalletBalance = useWalletStore((s) => s.setWalletBalance);
    const setGpuDevices = useMiningMetricsStore((s) => s.setGpuDevices);
    const setGpuMiningStatus = useMiningMetricsStore((s) => s.setGpuMiningStatus);
    const setCpuMiningStatus = useMiningMetricsStore((s) => s.setCpuMiningStatus);
    const setConnectedPeers = useMiningMetricsStore((s) => s.setConnectedPeers);
    const setBaseNodeStatus = useMiningMetricsStore((s) => s.setBaseNodeStatus);
    const setDisplayBlockHeight = useBlockchainVisualisationStore((s) => s.setDisplayBlockHeight);
    const refreshCoinbaseTransactions = useWalletStore((s) => s.refreshCoinbaseTransactions);
    const displayBlockHeight = useBlockchainVisualisationStore((s) => s.debugBlockTime);
    const isMiningInitiated = useMiningStore((s) => s.miningInitiated);
    const wasNodeConnected = useMiningMetricsStore((s) => s.connected_peers?.length);

    useEffect(() => {
        const unlisten = listen(FRONTEND_EVENT, ({ payload: event }: { payload: FrontendEventPayload }) => {
            switch (event.event_type) {
                case FrontendEvent.WalletAddressUpdate:
                    console.log('xxxxxxxxx WalletAddressUpdate', event.payload);
                    setWalletAddress(event.payload);
                    break;
                case FrontendEvent.WalletBalanceUpdate:
                    console.log('yyyyyyyyyyy WalletBalanceUpdate', event.payload);
                    setWalletBalance(event.payload);
                    break;
                case FrontendEvent.BaseNodeUpdate:
                    setBaseNodeStatus(event.payload);
                    if (event.payload.block_height && !displayBlockHeight) {
                        // initial block height
                        setDisplayBlockHeight(event.payload.block_height);
                    }
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
                    if (isMiningInitiated) {
                        const isNodeConnected = event.payload?.length > 0;
                        if (!isNodeConnected && wasNodeConnected) {
                            setAnimationState('stop');
                        }
                        if (isNodeConnected && !wasNodeConnected) {
                            setAnimationState('start');
                        }
                    }
                    setConnectedPeers(event.payload);
                    break;
                case FrontendEvent.NewBlockHeight:
                    handleNewBlock(event.payload);
                    refreshCoinbaseTransactions();
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
        displayBlockHeight,
        isMiningInitiated,
        refreshCoinbaseTransactions,
        setBaseNodeStatus,
        setConnectedPeers,
        setCpuMiningStatus,
        setDisplayBlockHeight,
        setGpuDevices,
        setGpuMiningStatus,
        setWalletAddress,
        setWalletBalance,
        wasNodeConnected,
    ]);
};

export default useTauriEventsListener;
