import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

import { useVisualisation } from './useVisualisation.ts';
import useAppStateStore from '@app/store/appStateStore.ts';

export function useMiningControls() {
    const handleVisual = useVisualisation();
    const setError = useAppStateStore((s) => s.setError);

    return useCallback(
        async (type: 'start' | 'stop') => {
            const isStart = type === 'start';
            try {
                if (isStart) {
                    return await invoke('start_mining', {})
                        .then(async () => {
                            console.info('Mining started.');
                            await handleVisual('showVisual').then(() => handleVisual('start'));
                        })
                        .catch((e) => console.error(e));
                } else {
                    return await invoke('stop_mining', {})
                        .then(async () => {
                            console.info('Mining stopped.');
                            await handleVisual('stop');
                        })
                        .catch((e) => console.error(e));
                }
            } catch (e) {
                const error = e as string;
                setError(error);
            }
        },
        [handleVisual, setError]
    );
}
