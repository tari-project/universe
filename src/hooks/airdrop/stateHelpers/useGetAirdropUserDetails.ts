import { useAirdropStore, UserEntryPoints, UserDetails, ReferralCount, BonusTier } from '@app/store/useAirdropStore';
import { useCallback, useEffect } from 'react';
import { useAirdropRequest } from '../utils/useHandleRequest';
import { handleAirdropLogout, setBonusTiers, setReferralCount, setUserDetails, setUserPoints } from '@app/store';

export const useGetAirdropUserDetails = () => {
    const baseUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdropApiUrl);
    const airdropToken = useAirdropStore((state) => state.airdropTokens?.token);
    const handleRequest = useAirdropRequest();

    const handleErrorLogout = useCallback(() => {
        console.error('Error fetching user details, logging out');
        handleAirdropLogout();
    }, []);

    // FETCH ALL USER DATA
    useEffect(() => {
        // GET USER DETAILS
        const fetchUserDetails = async () => {
            return handleRequest<UserDetails>({
                path: '/user/details',
                method: 'GET',
                onError: handleErrorLogout,
            })
                .then((data) => {
                    if (data?.user?.id) {
                        setUserDetails(data);
                        return data.user;
                    } else {
                        handleErrorLogout();
                    }
                })
                .catch(() => handleErrorLogout());
        };

        // GET USER POINTS
        const fetchUserPoints = async () => {
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
        };

        // GET USER REFERRAL POINTS
        const fetchUserReferralPoints = async () => {
            const data = await handleRequest<{ count: ReferralCount }>({
                path: '/miner/download/referral-count',
                method: 'GET',
            });
            if (!data?.count) return;
            setReferralCount({
                gems: data.count.gems,
                count: data.count.count,
            });
        };

        // FETCH BONUS TIERS
        const fetchBonusTiers = async () => {
            const data = await handleRequest<{ tiers: BonusTier[] }>({
                path: '/miner/download/bonus-tiers',
                method: 'GET',
            });
            if (!data?.tiers) return;
            setBonusTiers(data?.tiers);
        };

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

        if (airdropToken) {
            fetchData();
        }
    }, [airdropToken, handleErrorLogout, handleRequest, baseUrl]);
};
