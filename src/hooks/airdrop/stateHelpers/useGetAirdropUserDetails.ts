import { useAirdropStore } from '@app/store/useAirdropStore';
import { useCallback, useEffect } from 'react';

export const useGetAirdropUserDetails = () => {
    const airdropToken = useAirdropStore((state) => state.airdropTokens?.token);
    const setUserDetails = useAirdropStore((state) => state.setUserDetails);

    const fetchUserDetails = useCallback(async () => {
        const response = await fetch('https://airdrop.tari.com/api/user/details', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${airdropToken}`,
            },
        });
        const data = await response.json();
        setUserDetails(data);
        return data;
    }, [airdropToken, setUserDetails]);

    useEffect(() => {
        fetchUserDetails();
    }, [fetchUserDetails]);
};
