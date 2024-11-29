import { useCallback, useEffect, useState } from 'react';
import { useAirdropRequest } from '../utils/useHandleRequest';
import { ReferralsResponse, useShellOfSecretsStore } from '@app/store/useShellOfSecretsStore';

export const useGetSosReferrals = () => {
    const [intervalSeconds, setIntervalSeconds] = useState(0);
    const handleRequest = useAirdropRequest();
    const setReferrals = useShellOfSecretsStore((state) => state.setReferrals);

    const fetchUserReferrals = useCallback(async () => {
        const data = await handleRequest<ReferralsResponse>({
            path: '/sos/referrals/',
            method: 'GET',
        });
        if (!data?.toleranceMs) return;
        setReferrals(data);
    }, [handleRequest, setReferrals]);

    useEffect(() => {
        if (intervalSeconds) {
            const intervalId = setInterval(fetchUserReferrals, intervalSeconds * 1000);
            return () => clearInterval(intervalId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [intervalSeconds]);

    return { handleFetchUserDetails: fetchUserReferrals, setRefetchIntervalSeconds: setIntervalSeconds };
};
