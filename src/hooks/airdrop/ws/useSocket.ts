import { useEffect, useState } from 'react';
import { useAirdropStore } from '@app/store';
import { useHandleWsUserIdEvent } from '@app/hooks/airdrop/ws/useHandleWsUserIdEvent.ts';
import { initialiseSocket, OnDisconnectEventMessage, socket, SUBSCRIBE_EVENT } from '@app/utils/socket.ts';
import { useHandleWsGlobalEvent } from '@app/hooks/airdrop/ws/useHandleWsGlobalEvent.ts';
import { GLOBAL_EVENT_NAME } from '@app/types/ws.ts';

const AUTH_EVENT = 'auth';

export default function useSocketEvents() {
    const userId = useAirdropStore((s) => s.userDetails?.user?.id);
    const airdropToken = useAirdropStore((s) => s.airdropTokens?.token);
    const airdropApiUrl = useAirdropStore((s) => s.backendInMemoryConfig?.airdropApiUrl);
    const handleWsUserIdEvent = useHandleWsUserIdEvent();
    const handleWsGlobalEvent = useHandleWsGlobalEvent();
    const [socketConnection, setSocketConnection] = useState(socket);

    useEffect(() => {
        if (!userId || !airdropToken || !socketConnection) return;
        function onConnectError(error: Error) {
            console.error('Error connecting to websocket:', error);
        }
        function onDisconnect(reason: string, details?: OnDisconnectEventMessage['details']) {
            console.error('Disconnected from websocket:', reason, details);
        }

        socketConnection?.on('disconnect', onDisconnect);
        socketConnection?.on('connect_error', onConnectError);
        return () => {
            socketConnection?.off('disconnect', onDisconnect);
            socketConnection?.off('connect_error', onConnectError);
        };
    }, [airdropToken, userId, socketConnection]);

    useEffect(() => {
        if (!userId) return;

        if (!socketConnection && airdropApiUrl && airdropToken) {
            const newSocket = initialiseSocket(airdropApiUrl, airdropToken);
            setSocketConnection(newSocket);
            return;
        }

        const setupEventHandlers = () => {
            socketConnection?.emit(AUTH_EVENT, airdropToken);
            socketConnection?.on(userId, handleWsUserIdEvent);
            socketConnection?.on(GLOBAL_EVENT_NAME, handleWsGlobalEvent);
        };

        // Set up handlers immediately if socket is connected
        if (socketConnection?.connected) {
            setupEventHandlers();
        }

        // Also set up handlers on reconnection
        socketConnection?.on('connect', setupEventHandlers);
        socketConnection?.emit(SUBSCRIBE_EVENT);

        return () => {
            socketConnection?.off('connect', setupEventHandlers);
            socketConnection?.off(userId, handleWsUserIdEvent);
            socketConnection?.off(GLOBAL_EVENT_NAME, handleWsGlobalEvent);
        };
    }, [socketConnection, airdropApiUrl, airdropToken, handleWsGlobalEvent, handleWsUserIdEvent, userId]);
}
