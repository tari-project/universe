import { once } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';

export const useIsAppReady = () => {
    const [isAppReady, setIsAppReady] = useState(false);
    useEffect(() => {
        const listener = once('app_ready', () => {
            setIsAppReady(true);
        });
        return () => {
            listener.then((unlisten) => unlisten());
        };
    }, []);
    return isAppReady;
};
