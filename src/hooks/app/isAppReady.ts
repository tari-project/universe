import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { setSetupComplete } from '@app/store/actions/setupStoreActions.ts';

export const useIsAppReady = () => {
    const [isAppReady, setIsAppReady] = useState(false);
    useEffect(() => {
        const setupListener = async () => {
            const listener = await listen('app_ready', ({ payload }: { payload: boolean }) => {
                if (payload) {
                    setSetupComplete();
                }
                setIsAppReady(true);
            });
            await invoke('frontend_ready');
            return listener;
        };

        const cleanup = setupListener();

        return () => {
            cleanup.then((unlisten) => unlisten());
        };
    }, []);
    return isAppReady;
};
