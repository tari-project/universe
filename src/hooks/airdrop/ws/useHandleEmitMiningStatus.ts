import { useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { socket } from '@app/utils/socket.ts';
import { useAirdropStore, useAppConfigStore, useMiningMetricsStore, useMiningStore } from '@app/store';

const MINING_EVENT_NAME = 'mining-status';
const MINING_EVENT_INTERVAL_MS = 15 * 1000;
function useHandleEmitMiningStatus() {
    const version = import.meta.env.VITE_TARI_UNIVERSE_VERSION;
    const blockHeight = useMiningMetricsStore((s) => s.base_node_status.block_height);
    const appId = useAppConfigStore((state) => state.anon_id);
    const network = useMiningStore((state) => state.network);
    const userId = useAirdropStore((s) => s.userDetails?.user?.id);

    return useCallback(
        ({ isMining }: { isMining: boolean }) => {
            if (!socket || !socket?.connected) return;
            const payload = {
                isMining,
                appId,
                blockHeight,
                version,
                network,
                userId,
            };
            const transformed = `${payload.version},${payload.network},${payload.appId},${payload.userId},${payload.isMining},${payload.blockHeight}`;
            invoke('sign_ws_data', {
                data: transformed,
            })
                .then(async (signatureData) => {
                    if (signatureData && socket) {
                        await socket.timeout(5000).emitWithAck(MINING_EVENT_NAME, {
                            data: payload,
                            signature: signatureData.signature,
                            pubKey: signatureData.pubKey,
                        });
                    }
                })
                .catch((e) => {
                    console.error('Error signing ws data: ', e);
                });
        },
        [appId, blockHeight, network, userId, version]
    );
}

export function useEmitMiningStatus() {
    const emitMiningStatus = useHandleEmitMiningStatus();
    const isMining = useMiningMetricsStore(
        (s) => (s.cpu_mining_status?.is_mining || s.gpu_mining_status?.is_mining) && s.isNodeConnected
    );

    useEffect(() => {
        if (!isMining) {
            emitMiningStatus({ isMining });
            return;
        } else {
            const emitIntervalId = setInterval(() => {
                emitMiningStatus({ isMining });
            }, MINING_EVENT_INTERVAL_MS);

            return () => {
                clearInterval(emitIntervalId);
            };
        }
    }, [emitMiningStatus, isMining]);
}
