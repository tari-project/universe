import { listen, emit } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';

export const useIsAppReady = () => {
    const [isAppReady, setIsAppReady] = useState(false);

    useEffect(() => {
        emit('frontend_ready', {});

        const listener = listen('app_ready', () => {
            setIsAppReady(true);
        });

        return () => {
            listener.then((unlisten) => unlisten());
        };
    }, []);

    return isAppReady;
};
