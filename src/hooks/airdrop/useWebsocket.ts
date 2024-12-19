import { io } from 'socket.io-client';
import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMiningStore } from '@app/store/useMiningStore';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { useHandleWsUserIdEvent } from './ws/useHandleWsUserIdEvent';
import { invoke } from '@tauri-apps/api/core';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore';
import { useAppStateStore } from '@app/store/appStateStore';
import { MINING_EVENT_INTERVAL_MS, useShellOfSecretsStore } from '@app/store/useShellOfSecretsStore';

let socket: ReturnType<typeof io> | null;

const MINING_EVENT_NAME = 'mining-status';

interface SignData {
    signature: string;
    pubKey: string;
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
    const registerWsConnectionEvent = useShellOfSecretsStore((state) => state.registerWsConnectionEvent);

    const isMining = useMemo(() => {
        const isMining = (cpu?.mining.is_mining || gpu?.mining.is_mining) && base_node?.is_connected;
        return isMining;
    }, [base_node?.is_connected, cpu?.mining.is_mining, gpu?.mining.is_mining]);

    const handleEmitMiningStatus = useCallback(
        async (isMining: boolean) => {
            if (!socket || !connectedSocket) return;
            const payload = {
                isMining,
                appId,
                blockHeight: height,
                version: applicationsVersions?.tari_universe,
                network,
                userId,
            };
            try {
                const transformedPayload = `${payload.version},${payload.network},${payload.appId},${payload.userId},${payload.isMining},${payload.blockHeight}`;
                const signatureData = (await invoke('sign_ws_data', {
                    data: transformedPayload,
                })) as SignData;

                const statusResponse: { error?: string; success: boolean } = await socket
                    .timeout(5000)
                    .emitWithAck(MINING_EVENT_NAME, {
                        data: payload,
                        signature: signatureData.signature,
                        pubKey: signatureData.pubKey,
                    });
                if (statusResponse) {
                    registerWsConnectionEvent({
                        state: statusResponse.success ? 'up' : 'error',
                        error: `shell of secrets mining error - reason: ${statusResponse.error}`,
                    });
                }
            } catch (e) {
                console.error(e);
            }
        },
        [
            connectedSocket,
            appId,
            height,
            applicationsVersions?.tari_universe,
            network,
            userId,
            registerWsConnectionEvent,
        ]
    );

    useEffect(() => {
        if (isMining) {
            const intervalId = setInterval(() => {
                handleEmitMiningStatus(isMining);
            }, MINING_EVENT_INTERVAL_MS);
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
                registerWsConnectionEvent({
                    state: 'up',
                });
                setConnectedSocket(true);
                socket.emit('auth', airdropToken);
                socket.on(userId as string, handleWsUserIdEvent);
            });

            socket.on('connect_error', (e) => {
                registerWsConnectionEvent({
                    state: 'error',
                    error: 'could not connect to server',
                });
            });
            socket.on('disconnect', (reason, details) => {
                registerWsConnectionEvent({
                    state: 'error',
                    error: 'disconnected from server',
                });
                console.error(reason, details);
            });
            socket.io.on('reconnect', (e) => {
                registerWsConnectionEvent({
                    state: 'up',
                });
            });
        } catch (e) {
            registerWsConnectionEvent({
                state: 'error',
                error: 'error at initiating connection',
            });
            console.error(e);
        }
    };

    const disconnect = () => {
        try {
            if (socket) {
                setConnectedSocket(false);
                handleEmitMiningStatus(isMining);
                registerWsConnectionEvent({
                    state: 'off',
                });
                socket.disconnect();
                socket = null;
            }
        } catch (e) {
            registerWsConnectionEvent({
                state: 'error',
                error: 'error at disconnecting',
            });
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
