import { io } from 'socket.io-client';
import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { QuestCompletedEvent } from '@app/types/ws';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMiningStore } from '@app/store/useMiningStore';
import { useAppConfigStore } from '@app/store/useAppConfigStore';

let socket: ReturnType<typeof io> | null;

const MINING_EVENT_INTERVAL = 5000;
const MINING_EVENT_NAME = 'mining-status';

export const useWebsocket = () => {
    const airdropToken = useAirdropStore((state) => state.airdropTokens?.token);
    const userId = useAirdropStore((state) => state.userDetails?.user?.id);
    const setUserGems = useAirdropStore((state) => state.setUserGems);
    const setWebsocket = useAirdropStore((state) => state.setWebsocket);
    const baseUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdropApiUrl);
    const cpu = useMiningStore((state) => state.cpu);
    const gpu = useMiningStore((state) => state.gpu);
    const network = useMiningStore((state) => state.network);
    const appId = useAppConfigStore((state) => state.anon_id);
    const base_node = useMiningStore((state) => state.base_node);
    const [connectedSocket, setConnectedSocket] = useState(false);

    const isMining = useMemo(() => {
        const isMining = (cpu?.mining.is_mining || gpu?.mining.is_mining) && base_node?.is_connected;
        return isMining;
    }, [base_node?.is_connected, cpu?.mining.is_mining, gpu?.mining.is_mining]);

    const handleEmitMiningStatus = useCallback(
        (isMining: boolean) => {
            if (!socket || !connectedSocket) return;
            const arg = { isMining, timestamp: new Date().toISOString() };
            try {
                // eslint-disable-next-line no-console
                socket.emit(MINING_EVENT_NAME, arg, console.log);
            } catch (e) {
                console.error(e);
            }
        },
        [connectedSocket]
    );

    useEffect(() => {
        if (isMining) {
            const intervalId = setInterval(() => {
                handleEmitMiningStatus(isMining);
            }, MINING_EVENT_INTERVAL);
            return () => clearInterval(intervalId);
        } else {
            handleEmitMiningStatus(isMining);
        }
    }, [baseUrl, handleEmitMiningStatus, network, isMining]);

    const init = () => {
        try {
            if (!socket && baseUrl) {
                socket = io(baseUrl, {
                    secure: true,
                    transports: ['websocket', 'polling'],
                    auth: { token: airdropToken, appId: appId, network: network },
                });
            }

            if (!socket) return;

            setWebsocket(socket);
            socket.emit('subscribe-to-gem-updates');
            socket.on('connect', () => {
                if (!socket) return;
                setConnectedSocket(true);
                // socket.emit('auth', airdropToken);
                socket.on(userId as string, (msg: string) => {
                    const msgParsed = JSON.parse(msg) as QuestCompletedEvent;
                    if (msgParsed?.data?.userPoints?.gems) {
                        setUserGems(msgParsed.data.userPoints?.gems);
                    }
                });
            });
        } catch (e) {
            console.error(e);
        }
    };

    const disconnect = () => {
        try {
            if (socket) {
                setConnectedSocket(false);
                handleEmitMiningStatus(false);
                socket.disconnect();
                socket = null;
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        try {
            if (airdropToken && userId && baseUrl) {
                init();
            }
            return () => {
                disconnect();
            };
        } catch (e) {
            console.error(e);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [airdropToken, userId, baseUrl]);

    return { init, disconnect, socket };
};
