import { useAirdropStore, UserPoints } from '@app/store/useAirdropStore';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';

export const useAirdropUserPointsListener = () => {
    const setUserPoints = useAirdropStore((state) => state.setUserPoints);
    useEffect(() => {
        let unListen: () => void = () => {
            //do nothing
        };

        listen('UserPoints', (event) => {
            if (event.event === 'UserPoints') {
                if (event.payload) {
                    setUserPoints(event.payload as UserPoints);
                }
            }
        })
            .then((unListenFunction) => {
                unListen = unListenFunction;
            })
            .catch(console.error);

        return () => {
            unListen();
        };
    }, [setUserPoints]);
};
