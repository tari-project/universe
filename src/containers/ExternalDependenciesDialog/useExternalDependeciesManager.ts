import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';

export const useExternalDependeciesManager = () => {
    useEffect(() => {
        const unlistenPromise = listen('missing-applications', ({ event: e, payload: p }: TauriEvent) => {});

        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, []);
};
