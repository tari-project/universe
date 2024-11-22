import { useAirdropStore, UserPoints } from '@app/store/useAirdropStore';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';

export const useAirdropUserPointsListener = () => {
    const setUserPoints = useAirdropStore((state) => state.setUserPoints);
    const referralCount = useAirdropStore((state) => state.referralCount);
    const bonusTiers = useAirdropStore((state) => state.bonusTiers);
    const setUserPointsReferralCount = useAirdropStore((state) => state.setReferralCount);
    const setFlareAnimationType = useAirdropStore((state) => state.setFlareAnimationType);

    useEffect(() => {
        let unListen: () => void = () => {
            //do nothing
        };

        listen('UserPoints', (event) => {
            if (event.payload) {
                const payload = event.payload as UserPoints;
                setUserPoints(payload);
                if (payload.referralCount) {
                    if (referralCount?.count !== payload.referralCount.count) {
                        if (referralCount?.count) {
                            setFlareAnimationType('FriendAccepted');
                            if (
                                payload.referralCount.count &&
                                bonusTiers?.find((t) => t.target === payload?.referralCount?.count)
                            ) {
                                setTimeout(() => {
                                    setFlareAnimationType('GoalComplete');
                                }, 2000);
                            }
                        }
                        setUserPointsReferralCount(payload.referralCount);
                    }
                }
            }
        })
            .then((unListenFunction) => {
                unListen = unListenFunction;
            })
            .catch((e) => {
                console.error('User points error: ', e);
            });

        return () => {
            unListen();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bonusTiers, referralCount?.count]);
};
