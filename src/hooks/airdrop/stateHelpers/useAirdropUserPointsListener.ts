import { useAirdropStore, UserPoints } from '@app/store/useAirdropStore';
import { deepEqual } from '@app/utils/objectDeepEqual';
import { listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useRef } from 'react';

export const useAirdropUserPointsListener = () => {
    const setUserPoints = useAirdropStore((state) => state?.setUserPoints);
    const currentReferralData = useAirdropStore((state) => state?.referralCount);
    const bonusTiers = useAirdropStore((state) => state.bonusTiers);
    const setFlareAnimationType = useAirdropStore((state) => state.setFlareAnimationType);
    const cachedUserPoints = useRef<UserPoints>();

    const handleAirdropPoints = useCallback(
        (pointsPayload: UserPoints) => {
            const incomingReferralData = pointsPayload?.referralCount;
            if (incomingReferralData?.count && incomingReferralData?.count !== currentReferralData?.count) {
                setFlareAnimationType('FriendAccepted');

                const goalComplete = bonusTiers?.find((t) => t.target === incomingReferralData?.count);
                if (goalComplete && goalComplete.bonusGems) {
                    setTimeout(() => setFlareAnimationType('GoalComplete'), 3000);
                }

                setUserPoints(pointsPayload);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [bonusTiers, currentReferralData?.count]
    );

    useEffect(() => {
        const ul = listen('UserPoints', ({ payload }) => {
            if (!payload) return;
            const payloadChanged = !deepEqual(payload as UserPoints, cachedUserPoints.current);
            if (payloadChanged) {
                handleAirdropPoints(payload as UserPoints);
            }
        });
        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, [handleAirdropPoints]);
};
