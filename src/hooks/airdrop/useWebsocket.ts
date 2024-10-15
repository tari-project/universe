import { io } from 'socket.io-client';
import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { QuestCompletedEvent } from '@app/types/ws';

let socket: ReturnType<typeof io> | null;

export const useWebsocket = () => {
    const airdropToken = useAirdropStore((state) => state.airdropTokens?.token);
    const userId = useAirdropStore((state) => state.userDetails?.user?.id);
    const baseUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdropApiUrl);
    // console.log('ws hook', baseUrl?.replace('http', 'ws'), airdropToken);

    const init = () => {
        if (!socket) {
            socket = io((baseUrl || 'ws://localhost:3004').replace('http', 'ws'), {
                // path: '/ws',
                // cors: {
                //     origin: '*',
                // },
            });
        }

        if (airdropToken && userId) {
            socket.emit('auth', airdropToken);
            socket.on(userId, (msg: QuestCompletedEvent) => {
                console.info('WS message', msg);
            });
        }
    };

    const disconnect = () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    };

    return { init, disconnect, socket };
};
