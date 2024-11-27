import { io } from 'socket.io-client';
import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { QuestCompletedEvent } from '@app/types/ws';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMiningStore } from '@app/store/useMiningStore';
import { invoke } from '@tauri-apps/api/tauri';

let socket: ReturnType<typeof io> | null;

export const useWebsocket = () => {
    const airdropToken = useAirdropStore((state) => state.airdropTokens?.token);
    const userId = useAirdropStore((state) => state.userDetails?.user?.id);
    const setUserGems = useAirdropStore((state) => state.setUserGems);
    const setWebsocket = useAirdropStore((state) => state.setWebsocket);
    const baseUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdropApiUrl);
    const cpu = useMiningStore((state) => state.cpu);
    const gpu = useMiningStore((state) => state.gpu);
    const network = useMiningStore((state) => state.network);
    const base_node = useMiningStore((state) => state.base_node);
    const [appId, setAppId] = useState<string | null>(null);
    const isMining = useMemo(() => {
        const isMining = (cpu?.mining.is_mining || gpu?.mining.is_mining) && base_node?.is_connected;
        return isMining;
    }, [base_node?.is_connected, cpu?.mining.is_mining, gpu?.mining.is_mining]);

    const loadAppId = useCallback(async () => {
        try {
            const appId = (await invoke('get_app_id')) as string;
            setAppId(appId);
        } catch (e) {
            console.error('Failed to get appId');
        }
    }, []);

    useEffect(() => {
        loadAppId().catch(console.error).then();
    }, [loadAppId]);

    useEffect(() => {
        const func = async () => {
            try {
                if (socket) {
                    emitWithCallback(
                        socket,
                        'mining-status',
                        {
                            isMining,
                        },
                        // eslint-disable-next-line no-console
                        console.log
                    );
                }
            } catch (e) {
                console.error(e);
            }
        };
        func().catch(console.error);
    }, [airdropToken, appId, isMining, userId]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            try {
                if (socket && isMining) {
                    console.log('Sending regular mining status', baseUrl, network);
                    emitWithCallback(
                        socket,
                        'mining-status',
                        {
                            isMining,
                        },
                        // eslint-disable-next-line no-console
                        console.log
                    );
                }
            } catch (e) {
                console.error(e);
            }
        }, 5000);
        return () => clearInterval(intervalId);
    }, [appId, baseUrl, isMining, userId]);

    const init = () => {
        try {
            console.log('Connecting to websocket', baseUrl);
            if (!socket && baseUrl) {
                console.log('creating a new connection', baseUrl);

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
                emitWithCallback(
                    socket,
                    'mining-status',
                    {
                        isMining: false,
                    },
                    // eslint-disable-next-line no-console
                    console.log
                );
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

function emitWithCallback(socket, event, arg, func?: (value: any) => void) {
    socket.emit(event, arg, (value) => {
        if (value && func) {
            func(value);
        }
    });
}

// async function emitWithAck(socket, event, arg) {
//     try {
//         socket.timeout(5000).emitWithAck(event, arg);
//     } catch (e) {
//         emitWithAck(socket, event, arg);
//         console.error('Failed to emit with ack: ', e);
//     }
// }
