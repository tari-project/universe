import { listen } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';

export const useIsAppReady = () => {
    const [isAppReady, setIsAppReady] = useState(false);
    useEffect(() => {
        const listener = listen('app_ready', () => {
            setIsAppReady(true);
        });
        return () => {
            listener.then((unlisten) => unlisten());
        };
    }, []);
    return isAppReady;
};
