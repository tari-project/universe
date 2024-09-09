import { useAirdropStore } from '@app/store/useAirdropStore';
import { useCallback, useEffect } from 'react';

export const useGetAirdropUserDetails = () => {
    const airdropToken = useAirdropStore((state) => state.airdropTokens?.token);
    const setUserDetails = useAirdropStore((state) => state.setUserDetails);
    const backendInMemoryConfig = useAirdropStore((state) => state.backendInMemoryConfig);

    const fetchUserDetails = useCallback(async () => {
        if (!backendInMemoryConfig?.airdropApiUrl) return;

        const response = await fetch(`${backendInMemoryConfig?.airdropApiUrl}/user/details`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${airdropToken}`,
            },
        });
        const data = await response.json();
        setUserDetails(data);
        return data;
    }, [airdropToken, backendInMemoryConfig?.airdropApiUrl, setUserDetails]);

    useEffect(() => {
        fetchUserDetails();
    }, [fetchUserDetails]);
};
