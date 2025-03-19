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
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';

const MINING_EVENT_NAME = 'mining-status';

interface SignData {
    signature: string;
    pubKey: string;
}

export const useWebsocket = () => {
    const airdropToken = useAirdropStore((state) => state.airdropTokens?.token);
    const userId = useAirdropStore((state) => state.userDetails?.user?.id);
    const baseUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdropApiUrl);
    const cpuMiningStatus = useMiningMetricsStore((state) => state.cpu_mining_status);
    const gpuMiningStatus = useMiningMetricsStore((state) => state.gpu_mining_status);
    const network = useMiningStore((state) => state.network);
    const appId = useAppConfigStore((state) => state.anon_id);
    const isConnectedToNetwork = useMiningMetricsStore((state) => state.isNodeConnected);
    const handleWsUserIdEvent = useHandleWsUserIdEvent();
    const [connectedSocket, setConnectedSocket] = useState(false);
    const height = useBlockchainVisualisationStore((s) => s.displayBlockHeight);
    const applicationsVersions = useAppStateStore((state) => state.applications_versions);
    const registerWsConnectionEvent = useShellOfSecretsStore((state) => state.registerWsConnectionEvent);

    const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);

    const isMining = useMemo(() => {
        return (cpuMiningStatus?.is_mining || gpuMiningStatus?.is_mining) && isConnectedToNetwork;
    }, [isConnectedToNetwork, cpuMiningStatus?.is_mining, gpuMiningStatus?.is_mining]);

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
        // TODO: fix deps when we refactor + remove disabling of rule in this file
        [socket, connectedSocket, appId, height, applicationsVersions?.tari_universe, network, userId]
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
            let curSocket = socket;
            if (!curSocket && baseUrl) {
                curSocket = io(baseUrl, {
                    secure: true,
                    transports: ['websocket', 'polling'],
                    auth: {
                        token: airdropToken,
                        appId: appId,
                        network: network,
                        version: applicationsVersions?.tari_universe,
                    },
                });
                setSocket(curSocket);
            }

            if (!curSocket) return;

            curSocket.emit('subscribe-to-gem-updates');
            curSocket.on('connect', () => {
                registerWsConnectionEvent({
                    state: 'up',
                });
                setConnectedSocket(true);
                curSocket.emit('auth', airdropToken);
                curSocket.on(userId as string, handleWsUserIdEvent);
            });

            curSocket.on('connect_error', (_e) => {
                registerWsConnectionEvent({
                    state: 'error',
                    error: 'could not connect to server',
                });
            });
            curSocket.on('disconnect', (reason, details) => {
                registerWsConnectionEvent({
                    state: 'error',
                    error: 'disconnected from server',
                });
                console.error(reason, details);
            });
            curSocket.io.on('reconnect', (_e) => {
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
                setSocket(null);
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
        // TODO: fix deps when we refactor + remove disabling of rule in eslint.config
    }, [airdropToken, userId, baseUrl]);
};
