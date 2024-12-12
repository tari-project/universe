import { useAirdropStore, UserPoints } from '@app/store/useAirdropStore';
import { listen } from '@tauri-apps/api/event';
import { useCallback, useEffect } from 'react';

export const useAirdropUserPointsListener = () => {
    const setUserPoints = useAirdropStore((state) => state?.setUserPoints);
    const currentReferralData = useAirdropStore((state) => state?.referralCount);
    const bonusTiers = useAirdropStore((state) => state.bonusTiers);
    const setFlareAnimationType = useAirdropStore((state) => state.setFlareAnimationType);

    const handleAirdropPoints = useCallback(
        (pointsPayload: UserPoints) => {
            const incomingReferralData = pointsPayload?.referralCount;
            if (incomingReferralData?.count && incomingReferralData?.count !== currentReferralData?.count) {
                const secondAnimationDelay = setTimeout(() => setFlareAnimationType('GoalComplete'), 2000);
                setFlareAnimationType('FriendAccepted');
                const goalComplete = !!bonusTiers?.find((t) => t.target === incomingReferralData?.count);
                if (goalComplete) {
                    clearTimeout(secondAnimationDelay);
                }

                setUserPoints(pointsPayload);
            }
        },
        [bonusTiers, currentReferralData?.count, setFlareAnimationType, setUserPoints]
    );

    useEffect(() => {
        const ul = listen('UserPoints', ({ payload }) => {
            console.debug(payload);

            if (payload) {
                handleAirdropPoints(payload as UserPoints);
            }
        });
        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, [handleAirdropPoints]);
};
