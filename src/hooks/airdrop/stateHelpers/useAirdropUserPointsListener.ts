import { useAirdropStore, UserPoints } from '@app/store/useAirdropStore';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';

export const useAirdropUserPointsListener = () => {
    const setUserPoints = useAirdropStore((state) => state.setUserPoints);
    const setUserPointsReferralCount = useAirdropStore((state) => state.setReferralCount);
    useEffect(() => {
        let unListen: () => void = () => {
            //do nothing
        };

        listen('UserPoints', (event) => {
            if (event.payload) {
                const payload = event.payload as UserPoints;
                setUserPoints(payload);
                if (payload.referralCount) {
                    setUserPointsReferralCount(payload.referralCount);
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
    }, [setUserPoints, setUserPointsReferralCount]);
};
