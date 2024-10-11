import { io } from 'socket.io-client';
import { useAirdropStore } from '@app/store/useAirdropStore.ts';

let socket: typeof io;

export const useWebsocket = () => {
    const airdropToken = useAirdropStore((state) => state.airdropTokens?.token);
    const baseUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdropApiUrl);
    console.log('ws hook', baseUrl?.replace('http', 'ws'), airdropToken);
    const init = () => {
        if (!socket) {
            socket = io((baseUrl || 'ws://localhost:3004').replace('http', 'ws'), {
                // path: '/ws',
                cors: {
                    origin: '*',
                },
            });
        }
        socket.emit('auth', airdropToken);
        socket.on('message', (msg) => {
            console.log('got ws message', msg);
        });
    };

    const disconnect = () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    };

    return { init, disconnect, socket };
};
