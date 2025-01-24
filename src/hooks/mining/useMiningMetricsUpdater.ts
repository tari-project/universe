import { useCallback } from 'react';
import { MinerMetrics } from '@app/types/app-status';

import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';
import { setAnimationState } from '@app/visuals.ts';

export default function useMiningMetricsUpdater() {
    const setMiningMetrics = useMiningMetricsStore((s) => s.setMiningMetrics);
    const baseNodeConnected = useMiningMetricsStore((s) => s.base_node.is_connected);

    return useCallback(
        (metrics: MinerMetrics) => {
            if (metrics) {
                const isMining = metrics.cpu?.mining.is_mining || metrics.gpu?.mining.is_mining;

                if (isMining) {
                    if (!metrics.base_node?.is_connected && baseNodeConnected) {
                        setAnimationState('stop');
                    }
                    if (metrics.base_node?.is_connected && !baseNodeConnected) {
                        setAnimationState('start');
                    }
                }

                setMiningMetrics(metrics);
            }
        },
        [baseNodeConnected, setMiningMetrics]
    );
}
