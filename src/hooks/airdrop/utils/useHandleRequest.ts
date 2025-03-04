import { useAirdropStore } from '@app/store/useAirdropStore';

interface RequestProps extends Omit<RequestInit, 'body'> {
    path: string;
    method: 'GET' | 'POST';
    onError?: (e: unknown) => void;
    body?: Record<string, unknown>;
}

export const useAirdropRequest = () => {
    const airdropToken = useAirdropStore((state) => state.airdropTokens?.token);
    const airdropTokenExpiration = useAirdropStore((state) => state.airdropTokens?.expiresAt);
    const baseUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdropApiUrl);

    return async <T>(requestProps: RequestProps) => {
        const { path, method, body, onError, ...rest } = requestProps;
        const isTokenExpired = !airdropTokenExpiration || airdropTokenExpiration * 1000 < Date.now();
        if (!baseUrl || !airdropToken || isTokenExpired) return;

        const fullUrl = `${baseUrl}${path}`;

        const response = await fetch(fullUrl, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${airdropToken}`,
            },
            body: JSON.stringify(body),
            ...rest,
        });

        try {
            if (!response.ok) {
                console.error(`Error fetching airdrop request at ${fullUrl}: `, response);
                if (onError) {
                    onError(response);
                }
                return;
            }
            return response.json() as Promise<T>;
        } catch (e) {
            console.error(`Caught error fetching airdrop data at ${fullUrl}: `, e);

            if (onError) {
                onError(e);
            }
            return;
        }
    };
};
