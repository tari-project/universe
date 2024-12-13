import { useAirdropStore, UserEntryPoints, UserDetails, ReferralCount, BonusTier } from '@app/store/useAirdropStore';
import { useCallback, useEffect } from 'react';
import { useAirdropRequest } from '../utils/useHandleRequest';

export const useGetAirdropUserDetails = () => {
    const baseUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdropApiUrl);
    const airdropToken = useAirdropStore((state) => state.airdropTokens?.token);
    const userDetails = useAirdropStore((state) => state.userDetails);
    const setUserDetails = useAirdropStore((state) => state.setUserDetails);
    const setUserPoints = useAirdropStore((state) => state.setUserPoints);
    const setReferralCount = useAirdropStore((state) => state.setReferralCount);
    const handleRequest = useAirdropRequest();
    const setBonusTiers = useAirdropStore((state) => state.setBonusTiers);
    const logout = useAirdropStore((state) => state.logout);

    // GET USER DETAILS
    const fetchUserDetails = useCallback(async () => {
        return handleRequest<UserDetails>({
            path: '/user/details',
            method: 'GET',
            onError: logout,
        }).then((data) => {
            if (data?.user?.id) {
                setUserDetails(data);
                return data.user;
            }
        });
    }, [handleRequest, logout, setUserDetails]);

    // GET USER POINTS
    const fetchUserPoints = useCallback(async () => {
        const data = await handleRequest<UserEntryPoints>({
            path: '/user/score',
            method: 'GET',
        });
        if (!data?.entry || !data?.entry?.gems) return;
        setUserPoints({
            base: {
                gems: data.entry.gems,
                shells: data.entry.shells,
                hammers: data.entry.hammers,
            },
        });
    }, [handleRequest, setUserPoints]);

    // GET USER REFERRAL POINTS
    const fetchUserReferralPoints = useCallback(async () => {
        const data = await handleRequest<{ count: ReferralCount }>({
            path: '/miner/download/referral-count',
            method: 'GET',
        });
        if (!data?.count) return;
        setReferralCount({
            gems: data.count.gems,
            count: data.count.count,
        });
    }, [handleRequest, setReferralCount]);

    // FETCH BONUS TIERS
    const fetchBonusTiers = useCallback(async () => {
        const data = await handleRequest<{ tiers: BonusTier[] }>({
            path: '/miner/download/bonus-tiers',
            method: 'GET',
        });
        if (!data?.tiers) return;
        setBonusTiers(data?.tiers);
    }, [handleRequest, setBonusTiers]);

    // FETCH ALL USER DATA
    useEffect(() => {
        const fetchData = async () => {
            const details = await fetchUserDetails();

            if (!details) return;

            const requests: Promise<void>[] = [];
            if (!details?.rank?.gems) {
                requests.push(fetchUserPoints());
            }
            requests.push(fetchUserReferralPoints());
            requests.push(fetchBonusTiers());

            await Promise.all(requests);
        };

        if (!userDetails?.user?.id && airdropToken) {
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [airdropToken, userDetails, baseUrl]);
};
