import { listen } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';
import { setSetupComplete } from '@app/store/actions/appStateStoreActions.ts';
import { invoke } from '@tauri-apps/api/core';

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
