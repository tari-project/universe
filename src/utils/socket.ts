import { io } from 'socket.io-client';

import { useAppConfigStore, useMiningStore } from '@app/store';
import { invoke } from '@tauri-apps/api/core';

type DisconnectDescription =
    | Error
    | {
          description: string;
          context?: unknown;
      };

interface OnDisconnectEventMessage {
    reason: string;
    details?: DisconnectDescription;
}

let socket: ReturnType<typeof io> | null = null;
export const SUBSCRIBE_EVENT = 'subscribe-to-gem-updates';
const version = import.meta.env.VITE_TARI_UNIVERSE_VERSION;

const initialiseSocket = (airdropApiUrl: string, airdropToken: string) => {
    const appId = useAppConfigStore.getState().anon_id;
    const miningNetwork = useMiningStore.getState().network;
    const wsOptions = {
        auth: {
            token: airdropToken,
            appId,
            network: miningNetwork,
            version,
        },
        transports: ['websocket', 'polling'],
        secure: true,
    };

    invoke('start_mining_status').catch(console.error);
    socket = io(airdropApiUrl, wsOptions);
    console.info('Socket initialised');
    socket.connect();
    return socket;
};

function removeSocket() {
    socket?.disconnect();
    invoke('stop_mining_status').catch(console.error);
    socket = null;
    console.info('Socket removed');
}
export { socket, initialiseSocket, removeSocket, type OnDisconnectEventMessage };
