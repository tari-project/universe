import { useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

import { useVisualisation } from './useVisualisation.ts';
import useAppStateStore from '@app/store/appStateStore.ts';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';

import { useMiningStore } from '@app/store/useMiningStore.ts';

export function useMiningControls() {
    const handleVisual = useVisualisation();
    const setError = useAppStateStore((s) => s.setError);
    const isMining = useCPUStatusStore((s) => s.is_mining);

    const setMiningLoading = useMiningStore((s) => s.setMiningLoading);

    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const miningInitiated = useMiningStore((s) => s.miningInitiated);
    const setMiningInitiated = useMiningStore((s) => s.setMiningInitiated);

    const startMining = useCallback(async () => {
        setMiningInitiated(true);
        await invoke('start_mining', {})
            .then(() => {
                console.info(`mining started`);
            })
            .catch((e) => {
                setError(e);
            });
    }, [setMiningInitiated, setError]);

    const stopMining = useCallback(async () => {
        setMiningInitiated(false);
        await invoke('stop_mining', {})
            .then(async () => {
                console.info(`mining stopped`);
                await handleVisual('stop');
            })
            .catch(() => {
                setMiningInitiated(true);
            });
    }, [handleVisual, setMiningInitiated]);

    const cancelMining = useCallback(async () => {
        setMiningInitiated(false);
        await invoke('stop_mining', {}).then(async () => {
            console.info(`mining canceled`);
            await handleVisual('start');
            await handleVisual('stop');
        });
    }, [handleVisual, setMiningInitiated]);

    useEffect(() => {
        const initLoading = miningInitiated && !isMining;
        const modeChange = miningInitiated && isChangingMode;
        setMiningLoading(initLoading || modeChange);
    }, [isChangingMode, isMining, miningInitiated, setMiningLoading]);

    return {
        cancelMining,
        startMining,
        stopMining,
    };
}

// export function useMiningMode() {
//     const isMiningInProgress = useUIStore((s) => s.isMiningInProgress);
//     const changeMode = useCallback(
//         async (mode: string) => {
//             const hasBeenMining = isMiningInProgress;
//
//             if (!hasBeenMining) {
//                 await invoke('set_mode', { mode });
//                 return;
//             }
//
//             setIsChangingMode(true);
//             if (hasBeenMining && !isConnectionLostDuringMining) {
//                 await stopMining();
//             }
//
//             if (isConnectionLostDuringMining) {
//                 await cancelMining();
//             }
//
//             await invoke('set_mode', { mode });
//
//             if (hasBeenMining && !isConnectionLostDuringMining) {
//                 setTimeout(async () => {
//                     await startMining();
//                 }, 2000);
//             }
//
//             if (isConnectionLostDuringMining) {
//                 setIsChangingMode(false);
//             }
//         },
//         [isMiningInProgress, isConnectionLostDuringMining, cancelMining, setIsChangingMode, startMining, stopMining]
//     );
// }
