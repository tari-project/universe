import { useAirdropStore, UserPoints } from '@app/store/useAirdropStore';
import { deepEqual } from '@app/utils/objectDeepEqual';
import { listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useRef } from 'react';
import { setUserPoints } from '@app/store';

export const useAirdropUserPointsListener = () => {
    const currentReferralData = useAirdropStore((state) => state?.referralCount);
    const cachedUserPoints = useRef<UserPoints>();

    const handleAirdropPoints = useCallback(
        (pointsPayload: UserPoints) => {
            const incomingReferralData = pointsPayload?.referralCount;
            if (incomingReferralData?.count && incomingReferralData?.count !== currentReferralData?.count) {
                setUserPoints(pointsPayload);
            }
        },

        [currentReferralData?.count]
    );

    useEffect(() => {
        // TODO: remove this listener and BE emit per WS update conversation
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
