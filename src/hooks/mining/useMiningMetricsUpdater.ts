// import { useCallback, useDeferredValue } from 'react';
// import { handleNewBlock, useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore.ts';
// import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';
// import { setAnimationState } from '@app/visuals.ts';

export default function useMiningMetricsUpdater() {
    // const currentBlockHeight = useMiningMetricsStore((s) => s.base_node.block_height);
    // const baseNodeConnected = useMiningMetricsStore((s) => s.base_node.is_connected);

    // const displayBlockHeight = useBlockchainVisualisationStore((s) => s.displayBlockHeight);
    // const setDisplayBlockHeight = useBlockchainVisualisationStore((s) => s.setDisplayBlockHeight);

    // const deferredblock = useDeferredValue(currentBlockHeight);

    // return useCallback(
    //     async (metrics) => {
    //         if (metrics) {
    //             const isMining = metrics.cpu?.mining.is_mining || metrics.gpu?.mining.is_mining;

    //             if (isMining) {
    //                 if (!metrics.base_node?.is_connected && baseNodeConnected) {
    //                     setAnimationState('stop');
    //                 }
    //                 if (metrics.base_node?.is_connected && !baseNodeConnected) {
    //                     setAnimationState('start');
    //                 }
    //             }

    //             const blockHeight = metrics.base_node.block_height;
    //             const isNewBlock = blockHeight > 0 && deferredblock > 0 && blockHeight > deferredblock;

    //             if (isNewBlock) {
    //                 try {
    //                     await handleNewBlock(blockHeight, isMining);
    //                 } catch (_) {
    //                     setDisplayBlockHeight(blockHeight);
    //                 }
    //             } else {
    //                 if (blockHeight && !displayBlockHeight) {
    //                     setDisplayBlockHeight(blockHeight);
    //                 }
    //             }
    //         }
    //     },
    //     [baseNodeConnected, deferredblock, displayBlockHeight, setDisplayBlockHeight]
    // );
}
