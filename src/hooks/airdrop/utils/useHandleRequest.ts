import { useAirdropStore } from '@app/store/useAirdropStore';
import { handleRefreshAirdropTokens } from '@app/hooks/airdrop/stateHelpers/useAirdropTokensRefresh.ts';

interface RequestProps {
    path: string;
    method: 'GET' | 'POST';
    body?: Record<string, unknown>;
    onError?: (e: unknown) => void;
    headers?: HeadersInit | undefined;
}

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 250;
let retryCount = 0;

async function retryHandler(errorMessage: string) {
    retryCount++;
    const delay = retryCount * RETRY_INTERVAL;
    console.warn(`Attempt ${retryCount} failed with error: ${errorMessage}. Waiting ${delay}ms before retrying.`);
    return await new Promise((resolve) => setTimeout(resolve, delay));
}

export async function handleAirdropRequest<T>({ body, method, path, onError, headers }: RequestProps) {
    const airdropToken = useAirdropStore.getState().airdropTokens?.token;
    const airdropTokenExpiration = useAirdropStore.getState().airdropTokens?.expiresAt;
    const baseUrl = useAirdropStore.getState().backendInMemoryConfig?.airdropApiUrl;

    const isTokenExpired = !airdropTokenExpiration || airdropTokenExpiration * 1000 < Date.now();
    if (isTokenExpired) {
        if (retryCount >= MAX_RETRIES) {
            throw Error('Failed to refresh tokens from handleAirdropRequest');
        }
        try {
            const res = await handleRefreshAirdropTokens();
            if (!res) {
                await retryHandler('Refresh retry failed');
            }
        } catch (err) {
            const e = err as Error;
            await retryHandler(e.message ?? 'Caught error: Refresh retry failed');
        }
    } else {
        retryCount = 0;
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
