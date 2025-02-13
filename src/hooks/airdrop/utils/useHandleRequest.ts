import { useAirdropStore } from '@app/store/useAirdropStore';

interface RequestProps {
    path: string;
    method: 'GET' | 'POST';
    body?: Record<string, unknown>;
    onError?: (e: unknown) => void;
}

export async function handleAirdropRequest<T>({ body, method, path, onError }: RequestProps) {
    const airdropToken = useAirdropStore.getState().airdropTokens?.token;
    const airdropTokenExpiration = useAirdropStore.getState().airdropTokens?.expiresAt;
    const baseUrl = useAirdropStore.getState().backendInMemoryConfig?.airdropApiUrl;

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
        console.debug(e);
        console.error(`Caught error fetching airdrop data at ${fullUrl}: `, e);

        if (onError) {
            onError(e);
        }
        return;
    }
}
