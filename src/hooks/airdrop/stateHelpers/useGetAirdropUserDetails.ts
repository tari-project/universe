import { useAirdropStore, UserEntryPoints, UserDetails } from '@app/store/useAirdropStore';
import { useCallback, useEffect } from 'react';

interface RequestProps {
    path: string;
    method: 'GET' | 'POST';
    body?: Record<string, unknown>;
}

const useAridropRequest = () => {
    const airdropToken = useAirdropStore((state) => state.airdropTokens?.token);
    const baseUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdropApiUrl);

    return async <T>({ body, method, path }: RequestProps) => {
        if (!baseUrl || !airdropToken) return;

        const response = await fetch(`${baseUrl}${path}`, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${airdropToken}`,
            },
            body: JSON.stringify(body),
        });
        return response.json() as Promise<T>;
    };
};

export const useGetAirdropUserDetails = () => {
    const airdropToken = useAirdropStore((state) => state.airdropTokens?.token);
    const userDetails = useAirdropStore((state) => state.userDetails);
    const setUserDetails = useAirdropStore((state) => state.setUserDetails);
    const setUserPoints = useAirdropStore((state) => state.setUserPoints);
    const handleRequest = useAridropRequest();

    const fetchUserDetails = useCallback(async () => {
        const data = await handleRequest<UserDetails>({
            path: '/user/details',
            method: 'GET',
        });
        if (!data?.user.id) return;
        setUserDetails(data);
        return data.user;
    }, [handleRequest, setUserDetails]);

    const fetchUserPoints = useCallback(async () => {
        const data = await handleRequest<UserEntryPoints>({
            path: '/user/score',
            method: 'GET',
        });
        if (!data?.entry.gems) return;
        setUserPoints({
            base: {
                gems: data.entry.gems,
                shells: data.entry.shells,
                hammers: data.entry.hammers,
            },
        });
    }, [handleRequest, setUserPoints]);

    useEffect(() => {
        const fetchData = async () => {
            const details = await fetchUserDetails();
            if (!details?.rank.gems) {
                await fetchUserPoints();
            }
        };

        if (!userDetails?.user?.id) {
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [airdropToken, userDetails?.user?.id]);
};
