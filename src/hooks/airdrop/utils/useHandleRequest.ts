import { useAirdropStore } from '@app/store/useAirdropStore';
import { handleRefreshAirdropTokens } from '@app/hooks/airdrop/stateHelpers/useAirdropTokensRefresh.ts';

interface RequestProps {
    path: string;
    method: 'GET' | 'POST';
    body?: Record<string, unknown>;
    onError?: (e: unknown) => void;
    headers?: HeadersInit | undefined;
    publicRequest?: boolean;
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

export async function handleAirdropRequest<T>({ body, method, path, onError, headers, publicRequest }: RequestProps) {
    const airdropToken = useAirdropStore.getState().airdropTokens?.token;
    const airdropTokenExpiration = useAirdropStore.getState().airdropTokens?.expiresAt;
    const baseUrl = useAirdropStore.getState().backendInMemoryConfig?.airdropApiUrl;
    console.debug(airdropToken);

    const isTokenExpired = !airdropTokenExpiration || airdropTokenExpiration * 1000 < Date.now();
    console.debug(`isTokenExpired= `, isTokenExpired);
    if (isTokenExpired && !publicRequest) {
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

    // If no token and no public request, return
    if (!baseUrl || (!airdropToken && !publicRequest)) {
        console.warn(`No token or baseUrl, skipping request to ${path}`);
        return;
    }

    const fullUrl = `${baseUrl}${path}`;
    const headersWithAuth = airdropToken ? { Authorization: `Bearer ${airdropToken}` } : undefined;
    try {
        const response = await fetch(fullUrl, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headersWithAuth,
                ...headers,
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
