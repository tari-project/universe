import { useEffect } from 'react';
import { useAirdropStore } from '@app/store';
import { useHandleWsUserIdEvent } from '@app/hooks/airdrop/ws/useHandleWsUserIdEvent.ts';
import { OnDisconnectEventMessage, socket, SUBSCRIBE_EVENT } from '@app/utils/socket.ts';
import { useHandleWsGlobalEvent } from '@app/hooks/airdrop/ws/useHandleWsGlobalEvent.ts';
import { GLOBAL_EVENT_NAME } from '@app/types/ws.ts';

const AUTH_EVENT = 'auth';

export default function useSocketEvents() {
    const userId = useAirdropStore((s) => s.userDetails?.user?.id);
    const airdropToken = useAirdropStore((s) => s.airdropTokens?.token);
    const handleWsUserIdEvent = useHandleWsUserIdEvent();
    const handleWsGlobalEvent = useHandleWsGlobalEvent();

    useEffect(() => {
        socket?.connect();
        return () => {
            socket?.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!socket || !airdropToken) return;
        function onConnectError(error: Error) {
            console.error('Error connecting to websocket:', error);
        }
        function onDisconnect(reason: string, details?: OnDisconnectEventMessage['details']) {
            console.error('Disconnected from websocket:', reason, details);
        }

        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onConnectError);
        return () => {
            socket?.off('disconnect', onDisconnect);
            socket?.off('connect_error', onConnectError);
        };
    }, [airdropToken]);

    useEffect(() => {
        if (!socket || !userId) return;

        const onConnect = () => {
            socket?.emit(AUTH_EVENT, airdropToken);
            socket?.on(userId as string, handleWsUserIdEvent);
            socket?.on(GLOBAL_EVENT_NAME, handleWsGlobalEvent);
        };

        socket.emit(SUBSCRIBE_EVENT);
        socket.on('connect', onConnect);

        return () => {
            socket?.off('connect', onConnect);
        };
    }, [airdropToken, handleWsGlobalEvent, handleWsUserIdEvent, userId]);
}
