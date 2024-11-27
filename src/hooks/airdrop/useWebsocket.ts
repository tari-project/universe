import { io } from 'socket.io-client';
import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { QuestCompletedEvent } from '@app/types/ws';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMiningStore } from '@app/store/useMiningStore';
import { invoke } from '@tauri-apps/api/tauri';

let socket: ReturnType<typeof io> | null;

const NETWORK = 'esmeralda';

export const useWebsocket = () => {
    const airdropToken = useAirdropStore((state) => state.airdropTokens?.token);
    const userId = useAirdropStore((state) => state.userDetails?.user?.id);
    const setUserGems = useAirdropStore((state) => state.setUserGems);
    const setWebsocket = useAirdropStore((state) => state.setWebsocket);
    const baseUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdropApiUrl);
    const cpu = useMiningStore((state) => state.cpu);
    const gpu = useMiningStore((state) => state.gpu);
    const base_node = useMiningStore((state) => state.base_node);
    const [appId, setAppId] = useState<string | null>(null);
    const [socketConnected, setSocketConnected] = useState<boolean>(false);
    const isMining = useMemo(() => {
        const isMining = (cpu?.mining.is_mining || gpu?.mining.is_mining) && base_node?.is_connected;
        return isMining;
    }, [base_node?.is_connected, cpu?.mining.is_mining, gpu?.mining.is_mining]);

    useEffect(() => {
        invoke('get_app_id')
            .then((appId) => {
                setAppId(appId);
            })
            .catch(console.error);
    }, []);

    const handleMiningEvent = useCallback(
        (isMining = false) => {
            try {
                if (socket && socketConnected) {
                    socket.emit(
                        'mining-status',
                        {
                            isMining,
                            userId,
                            network: NETWORK,
                            appId: appId,
                        },
                        (value: unknown) => {
                            // eslint-disable-next-line no-console
                            console.log('mining-status', value);
                        }
                    );
                }
            } catch (e) {
                console.error(e);
            }
        },
        [appId, userId, socketConnected]
    );

    useEffect(() => {
        // Initial call to handleMiningEvent
        // (would probably have isMining === false in the first call)
        handleMiningEvent(isMining);
        if (isMining) {
            const intervalId = setInterval(() => {
                // Send regular mining status
                handleMiningEvent(isMining);
            }, 5000);
            return () => clearInterval(intervalId);
        }
    }, [appId, baseUrl, handleMiningEvent, isMining, userId]);

    const init = () => {
        try {
            if (!socket && baseUrl) {
                socket = io(baseUrl, {
                    secure: true,
                    transports: ['websocket', 'polling'],
                    auth: { token: airdropToken },
                });
            }

            if (!socket) return;

            setWebsocket(socket);
            socket.emit('subscribe-to-gem-updates');
            socket.on('connect', () => {
                if (!socket) return;
                setSocketConnected(true);
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
                handleMiningEvent(false);
                socket.disconnect();
                socket = null;
                setSocketConnected(false);
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
