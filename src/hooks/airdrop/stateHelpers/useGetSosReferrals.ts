import { useCallback, useEffect, useState } from 'react';

import { ReferralsResponse, useShellOfSecretsStore } from '@app/store/useShellOfSecretsStore';
import { CrewMember } from '@app/types/ws';
import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest.ts';

const MAX_REFERRALS = 100;

export const useGetSosReferrals = () => {
    const [intervalSeconds, setIntervalSeconds] = useState(0);

    const setReferrals = useShellOfSecretsStore((state) => state.setReferrals);
    const referrals = useShellOfSecretsStore((state) => state.referrals);

    const fetchUserReferrals = useCallback(async () => {
        const data = await handleAirdropRequest<ReferralsResponse>({
            path: '/sos/referrals/',
            method: 'GET',
        });
        if (!data?.toleranceMs) return;
        setReferrals(data);
    }, [setReferrals]);

    const fetchCrewMemberDetails = useCallback(
        async (userId: string) => {
            const existingReferral = referrals?.activeReferrals?.find((x) => x.id === userId);
            let updatedReferrals = referrals?.activeReferrals || [];
            let totalActiveReferrals = referrals?.totalActiveReferrals || 0;

            let shouldUpdate = false;
            if (!referrals) return;

            if (!existingReferral) {
                shouldUpdate = true;
                totalActiveReferrals += 1;

                const data = await handleAirdropRequest<CrewMember>({
                    path: `/sos/crew-member-data/${userId}/`,
                    method: 'GET',
                });

                if (data && data.id) {
                    updatedReferrals.push(data);

                    // Remove referrals if there are too many saved crew members
                    if (updatedReferrals.length > MAX_REFERRALS) {
                        const indexToRemove = updatedReferrals.findIndex((member) => member.active === false);
                        if (indexToRemove > -1) {
                            updatedReferrals.splice(indexToRemove, 1);
                        } else {
                            updatedReferrals.splice(15, 1);
                        }
                    }
                }
            } else if (existingReferral.active) {
                shouldUpdate = true;
                updatedReferrals = updatedReferrals.map((x) => {
                    if (x.id === userId) {
                        return { ...x, active: true };
                    }
                    return x;
                });
            }

            if (shouldUpdate) {
                setReferrals({
                    ...referrals,
                    totalActiveReferrals,
                    activeReferrals: updatedReferrals,
                });
            }
        },
        [referrals, setReferrals]
    );

    useEffect(() => {
        if (intervalSeconds) {
            const intervalId = setInterval(fetchUserReferrals, intervalSeconds * 1000);
            return () => clearInterval(intervalId);
        }
    }, [fetchUserReferrals, intervalSeconds]);

    return {
        fetchUserReferrals,
        setRefetchIntervalSeconds: setIntervalSeconds,
        fetchCrewMemberDetails,
    };
};
