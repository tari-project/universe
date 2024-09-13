import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { setAnimationState } from '@app/visuals.ts';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { useMiningStore } from '@app/store/useMiningStore';

export function useMiningControls() {
    const setError = useAppStateStore((s) => s.setError);
    const cpuMiner = useMiningStore((s) => s.cpuMiner);
    const handleStart = useCallback(async () => {
        console.info('Mining starting....');
        try {
            await invoke('start_mining', { miner: cpuMiner })
                .then(async () => {
                    console.info('Mining started.');
                })
                .catch((e) => console.error(e));
            setAnimationState('start');
        } catch (e) {
            const error = e as string;
            setError(error);
        }
    }, [setError, cpuMiner]);

    const handleStop = useCallback(
        async (args?: { isPause?: boolean }) => {
            console.info('Mining stopping...');
            try {
                await invoke('stop_mining', {})
                    .then(async () => {
                        if (args?.isPause) {
                            console.info('Mining stopped, as pause, to be restarted.');
                        } else {
                            console.info('Mining stopped.');
                        }
                    })
                    .catch((e) => console.error(e));
                setAnimationState(args?.isPause ? 'pause' : 'stop');
            } catch (e) {
                const error = e as string;
                setError(error);
            }
        },
        [setError]
    );

    return { handleStart, handleStop };
}
