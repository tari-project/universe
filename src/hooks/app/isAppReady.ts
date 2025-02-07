import { listen } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';
import { setSetupComplete } from '@app/store/appStateStore.ts';

interface Payload {
    setup_complete?: boolean;
}
export const useIsAppReady = () => {
    const [isAppReady, setIsAppReady] = useState(false);
    useEffect(() => {
        const listener = listen('app_ready', ({ event: _, payload: p }) => {
            if (p) {
                const payload = p as Payload;

                if (payload.setup_complete) {
                    setSetupComplete();
                }
            }
            setIsAppReady(true);
        });
        return () => {
            listener.then((unlisten) => unlisten());
        };
    }, []);
    return isAppReady;
};
