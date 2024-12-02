import { useCallback, useEffect, useState } from 'react';
import { useAirdropRequest } from '../utils/useHandleRequest';
import { ReferralsResponse, useShellOfSecretsStore } from '@app/store/useShellOfSecretsStore';
import { CrewMember } from '@app/types/ws';

const MAX_REFERRALS = 100;

export const useGetSosReferrals = () => {
    const [intervalSeconds, setIntervalSeconds] = useState(0);
    const handleRequest = useAirdropRequest();
    const setReferrals = useShellOfSecretsStore((state) => state.setReferrals);
    const referrals = useShellOfSecretsStore((state) => state.referrals);

    const fetchUserReferrals = useCallback(async () => {
        const data = await handleRequest<ReferralsResponse>({
            path: '/sos/referrals/',
            method: 'GET',
        });
        if (!data?.toleranceMs) return;
        setReferrals(data);
    }, [handleRequest, setReferrals]);

    const fetchCrewMemberDetails = useCallback(
        async (userId: string) => {
            const existingReferral = referrals?.activeReferrals?.find((x) => x.id === userId);
            let updatedReferrals = referrals?.activeReferrals || [];
            let totalActiveReferrals = referrals?.totalActiveReferrals || 0;

            if (!referrals) return;

            if (!existingReferral) {
                totalActiveReferrals += 1;

                const data = await handleRequest<CrewMember>({
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
            } else {
                updatedReferrals = updatedReferrals.map((x) => {
                    if (x.id === userId) {
                        return { ...x, active: true };
                    }
                    return x;
                });
            }

            setReferrals({
                ...referrals,
                totalActiveReferrals,
                activeReferrals: updatedReferrals,
            });
        },
        [handleRequest, referrals, setReferrals]
    );

    useEffect(() => {
        if (intervalSeconds) {
            const intervalId = setInterval(fetchUserReferrals, intervalSeconds * 1000);
            return () => clearInterval(intervalId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [intervalSeconds]);

    return {
        fetchUserReferrals,
        setRefetchIntervalSeconds: setIntervalSeconds,
        fetchCrewMemberDetails,
    };
};
