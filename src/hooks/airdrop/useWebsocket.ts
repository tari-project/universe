import { io } from 'socket.io-client';
import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMiningStore } from '@app/store/useMiningStore';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { useHandleWsUserIdEvent } from './ws/useHandleWsUserIdEvent';
import { invoke } from '@tauri-apps/api/core';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore';
import { useAppStateStore } from '@app/store/appStateStore';

let socket: ReturnType<typeof io> | null;

const MINING_EVENT_INTERVAL = 15000;
const MINING_EVENT_NAME = 'mining-status';

interface SignData {
    signature: string;
}

export const useWebsocket = () => {
    const airdropToken = useAirdropStore((state) => state.airdropTokens?.token);
    const userId = useAirdropStore((state) => state.userDetails?.user?.id);
    const baseUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdropApiUrl);
    const cpu = useMiningStore((state) => state.cpu);
    const gpu = useMiningStore((state) => state.gpu);
    const network = useMiningStore((state) => state.network);
    const appId = useAppConfigStore((state) => state.anon_id);
    const base_node = useMiningStore((state) => state.base_node);
    const handleWsUserIdEvent = useHandleWsUserIdEvent();
    const [connectedSocket, setConnectedSocket] = useState(false);
    const height = useBlockchainVisualisationStore((s) => s.displayBlockHeight);
    const applicationsVersions = useAppStateStore((state) => state.applications_versions);

    const isMining = useMemo(() => {
        const isMining = (cpu?.mining.is_mining || gpu?.mining.is_mining) && base_node?.is_connected;
        return isMining;
    }, [base_node?.is_connected, cpu?.mining.is_mining, gpu?.mining.is_mining]);

    const handleEmitMiningStatus = useCallback(
        async (isMining: boolean) => {
            if (!socket || !connectedSocket) return;
            const payload = { isMining, appId, blockHeight: height, version: applicationsVersions?.tari_universe };
            try {
                const transformedPayload = btoa(JSON.stringify(payload));
                const signatureData = (await invoke('sign_ws_data', {
                    dataBase64: transformedPayload,
                })) as SignData;
                socket.emit(MINING_EVENT_NAME, { data: payload, signature: signatureData.signature });
            } catch (e) {
                console.error(e);
            }
        },
        [appId, connectedSocket, height, applicationsVersions?.tari_universe]
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
                    auth: {
                        token: airdropToken,
                        appId: appId,
                        network: network,
                        version: applicationsVersions?.tari_universe,
                    },
                });
            }

            if (!socket) return;

            socket.emit('subscribe-to-gem-updates');
            socket.on('connect', () => {
                if (!socket) return;
                setConnectedSocket(true);
                socket.emit('auth', airdropToken);
                socket.on(userId as string, handleWsUserIdEvent);
            });
        } catch (e) {
            console.error(e);
        }
    };

    const disconnect = () => {
        try {
            if (socket) {
                setConnectedSocket(false);
                handleEmitMiningStatus(isMining);
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
