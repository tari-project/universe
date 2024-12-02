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
            const data = await handleRequest<CrewMember>({
                path: `/sos/crew-member-data/${userId}/`,
                method: 'GET',
            });

            if (data && data.id) {
                if (referrals?.activeReferrals?.every((x) => x.id !== data.id)) {
                    const updatedReferrals = [...(referrals?.activeReferrals || []), data];

                    // Remove referrals if there are too many saved crew members
                    if (updatedReferrals.length > MAX_REFERRALS) {
                        const indexToRemove = updatedReferrals.findIndex((member) => member.active === false);
                        if (indexToRemove > -1) {
                            updatedReferrals.splice(indexToRemove, 1);
                        } else {
                            updatedReferrals.splice(15, 1);
                        }
                    }
                    setReferrals({
                        ...referrals,
                        activeReferrals: updatedReferrals,
                    });
                }
                return data;
            }
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
