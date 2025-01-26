import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useWalletStore } from '@app/store/useWalletStore';
import { WalletBalance } from '@app/types/app-status';

const FRONTEND_EVENT = 'frontend_event';

enum FrontendEvent {
    WalletAddressUpdate = 'WalletAddressUpdate',
    WalletBalanceUpdate = 'WalletBalanceUpdate',
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
          event_type: FrontendEvent.WalletBalanceUpdate;
          payload: {
              balance: WalletBalance;
          };
      };

const useTauriEventsListener = () => {
    const setWalletAddress = useWalletStore((s) => s.setWalletAddress);
    const setWalletBalance = useWalletStore((s) => s.setWalletBalance);
    // Example event:
    // {"WalletBalanceUpdate":{"balance":{"available_balance":5398127087633,"timelocked_balance":0,"pending_incoming_balance":13617687141,"pending_outgoing_balance":0}}}
    useEffect(() => {
        const unlisten = listen(FRONTEND_EVENT, ({ payload: event }: { payload: FrontendEventPayload }) => {
            console.log(JSON.stringify(event));
            switch (event.event_type) {
                case FrontendEvent.WalletAddressUpdate:
                    console.log('WalletAddressUpdate', event.payload);
                    setWalletAddress(event.payload);
                    break;
                case FrontendEvent.WalletBalanceUpdate:
                    console.log('WalletBalanceUpdate', event.payload);
                    setWalletBalance(event.payload.balance);
                    break;
                default:
                    console.log('Unknown event', JSON.stringify(event));
                    break;
            }
        });

        return () => {
            unlisten.then((f) => f());
        };
    }, [setWalletAddress, setWalletBalance]);
};

export default useTauriEventsListener;
