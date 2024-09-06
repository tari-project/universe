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
                    await invoke('start_mining', {})
                        .then(() => console.info('Mining started.'))
                        .catch((e) => console.error(e));
                } else {
                    await invoke('stop_mining', {})
                        .then(() => console.info('Mining stopped.'))
                        .catch((e) => console.error(e));
                }

                await handleVisual(type);
            } catch (e) {
                const error = e as string;
                setError(error);
            }
        },
        [handleVisual, setError]
    );
}
