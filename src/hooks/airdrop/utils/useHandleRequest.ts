import { useAirdropStore } from '@app/store/useAirdropStore';
import { handleRefreshAirdropTokens } from '@app/hooks/airdrop/stateHelpers/useAirdropTokensRefresh.ts';

interface RequestProps {
    path: string;
    method: 'GET' | 'POST';
    body?: Record<string, unknown>;
    onError?: (e: unknown) => void;
    headers?: HeadersInit | undefined;
}

export async function handleAirdropRequest<T>({ body, method, path, onError, headers }: RequestProps) {
    const airdropToken = useAirdropStore.getState().airdropTokens?.token;
    const airdropTokenExpiration = useAirdropStore.getState().airdropTokens?.expiresAt;
    const baseUrl = useAirdropStore.getState().backendInMemoryConfig?.airdropApiUrl;

    const isTokenExpired = !airdropTokenExpiration || airdropTokenExpiration * 1000 < Date.now();

    if (isTokenExpired) {
        await handleRefreshAirdropTokens();
    }

    if (!headers && !headers && (!baseUrl || !airdropToken)) return;

    const fullUrl = `${baseUrl}${path}`;
    try {
        const response = await fetch(fullUrl, {
            method: method,
            headers: headers ?? {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${airdropToken}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            console.error(`Error fetching airdrop request at ${fullUrl}: `, response);
            if (onError) {
                onError(response);
            }
            return;
        } else {
            return (await response.json()) as T;
        }
    } catch (e) {
        console.error(`Caught error fetching airdrop data at ${fullUrl}: `, e);

        if (onError) {
            onError(e);
        }
        return;
    }
}
