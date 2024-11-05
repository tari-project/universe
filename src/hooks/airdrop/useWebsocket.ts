import { io } from 'socket.io-client';
import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { QuestCompletedEvent } from '@app/types/ws';
import { useEffect } from 'react';

let socket: ReturnType<typeof io> | null;

export const useWebsocket = () => {
    const airdropToken = useAirdropStore((state) => state.airdropTokens?.token);
    const userId = useAirdropStore((state) => state.userDetails?.user?.id);
    const setUserGems = useAirdropStore((state) => state.setUserGems);
    const baseUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdropApiUrl);

    const init = () => {
        if (!socket && baseUrl) {
            socket = io(baseUrl, { secure: true, transports: ['websocket', 'polling'] });
        }

        if (!socket) return;

        socket.on('connect', () => {
            if (!socket) return;
            socket.emit('auth', airdropToken);
            socket.on(userId as string, (msg: string) => {
                const msgParsed = JSON.parse(msg) as QuestCompletedEvent;
                if (msgParsed?.data?.userPoints?.gems) {
                    setUserGems(msgParsed.data.userPoints?.gems);
                }
            });
        });
    };

    const disconnect = () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    };

    useEffect(() => {
        if (airdropToken && userId && baseUrl) {
            init();
        }
        return () => {
            disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [airdropToken, userId, baseUrl]);

    return { init, disconnect, socket };
};
