import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

import { useVisualisation } from './useVisualisation.ts';
import useAppStateStore from '@app/store/appStateStore.ts';

export function useMiningControls() {
    const handleVisual = useVisualisation();
    const setError = useAppStateStore((s) => s.setError);
    const handleStart = useCallback(async () => {
        try {
            await invoke('start_mining', {})
                .then(async () => {
                    console.info('Mining started.');
                })
                .catch((e) => console.error(e));
            await handleVisual('start');
        } catch (e) {
            const error = e as string;
            setError(error);
        }
    }, [handleVisual, setError]);

    const handleStop = useCallback(
        async (args?: { isPause?: boolean }) => {
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
                await handleVisual(args?.isPause ? 'pause' : 'stop');
            } catch (e) {
                const error = e as string;
                setError(error);
            }
        },
        [handleVisual, setError]
    );

    return { handleStart, handleStop };
}
