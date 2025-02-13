import { useAirdropStore, UserEntryPoints, UserDetails, ReferralCount, BonusTier } from '@app/store/useAirdropStore';
import { useCallback, useEffect, useRef } from 'react';

import { handleAirdropLogout, setBonusTiers, setReferralCount, setUserDetails, setUserPoints } from '@app/store';
import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest.ts';

export const useGetAirdropUserDetails = () => {
    const { baseUrl, airdropToken } = useAirdropStore((s) => ({
        baseUrl: s.backendInMemoryConfig?.airdropApiUrl,
        airdropToken: s.airdropTokens?.token,
    }));

    const urlRef = useRef(baseUrl);
    const tokenRef = useRef(airdropToken);

    useEffect(
        () =>
            useAirdropStore.subscribe((state) => {
                tokenRef.current = state.airdropTokens?.token;
                urlRef.current = state.backendInMemoryConfig?.airdropApiUrl;
            }),
        []
    );

    // FETCH ALL USER DATA
    return useCallback(async () => {
        // GET USER DETAILS
        const fetchUserDetails = async () => {
            return await handleAirdropRequest<UserDetails>({
                path: '/user/details',
                method: 'GET',
                onError: handleAirdropLogout,
            })
                .then((data) => {
                    if (data?.user?.id) {
                        setUserDetails(data);
                        return data.user;
                    } else {
                        handleAirdropLogout();
                    }
                })
                .catch(() => {
                    handleAirdropLogout();
                });
        };
        // GET USER POINTS
        const fetchUserPoints = async () => {
            const data = await handleAirdropRequest<UserEntryPoints>({
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
            const data = await handleAirdropRequest<{ count: ReferralCount }>({
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
            const data = await handleAirdropRequest<{ tiers: BonusTier[] }>({
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
        if (tokenRef.current) {
            fetchData();
        }
    }, []);
};
