import { useAirdropStore } from '@app/store/useAirdropStore';
import { handleRefreshAirdropTokens } from '@app/hooks/airdrop/stateHelpers/useAirdropTokensRefresh.ts';
import { useConfigBEInMemoryStore } from '@app/store';
import { defaultHeaders } from '@app/utils';
import { invoke } from '@tauri-apps/api/core';
import { waitForTokensReady } from './startupSync';

interface RequestProps<B> {
    path: string;
    method: 'GET' | 'POST';
    body?: B;
    onError?: (e: unknown) => void;
    headers?: HeadersInit | undefined;
    publicRequest?: boolean;
}

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 250;
let retryCount = 0;

function isConfiguredAirdropDomain(url: string): boolean {
    const baseUrl = useConfigBEInMemoryStore.getState().airdrop_api_url;
    if (!baseUrl) return false;
    
    try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        return urlObj.hostname === baseUrlObj.hostname;
    } catch (error) {
        console.warn('Failed to parse URLs for domain comparison:', error);
        // Fallback: check if URL contains known airdrop domains
        return url.includes('ut.tari.com') || url.includes('rwa.yat.fyi');
    }
}

async function retryHandler(errorMessage: string) {
    retryCount++;
    const delay = retryCount * RETRY_INTERVAL;
    console.warn(`Attempt ${retryCount} failed with error: ${errorMessage}. Waiting ${delay}ms before retrying.`);
    return await new Promise((resolve) => setTimeout(resolve, delay));
}

async function makeNativeHttpRequest<T>(
    url: string,
    method: string,
    headers: Record<string, string>,
    body?: any
): Promise<T | undefined> {
    try {
        const httpRequest = {
            url,
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        };

        console.info(`Using native HTTP client for ${method} ${url}`);
        const response = await invoke<{
            status: number;
            headers: Record<string, string>;
            body?: any;
            error?: string;
        }>('http_request_airdrop', { request: httpRequest });

        if (response.error) {
            throw new Error(response.error);
        }

        if (response.status >= 200 && response.status < 300) {
            return response.body as T;
        } else {
            throw new Error(`HTTP ${response.status}: ${JSON.stringify(response.body)}`);
        }
    } catch (error) {
        console.error('Native HTTP request failed:', error);
        throw error;
    }
}

export async function handleAirdropRequest<T, B = Record<string, unknown>>({
    body,
    method,
    path,
    onError,
    headers,
    publicRequest,
}: RequestProps<B>) {
    // Wait for backend token initialization to complete
    if (!publicRequest) {
        try {
            await waitForTokensReady();
        } catch (error) {
            console.warn('Failed to wait for tokens ready, proceeding anyway:', error);
        }
    }

    const baseUrl = useConfigBEInMemoryStore.getState().airdrop_api_url;
    const airdropToken = useAirdropStore.getState().airdropTokens?.token;
    const airdropTokenExpiration = useAirdropStore.getState().airdropTokens?.expiresAt;

    const isTokenExpired = !airdropTokenExpiration || airdropTokenExpiration * 1000 < Date.now();

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
        console.warn(`No ${!baseUrl ? 'baseUrl' : 'token'}, skipping request to ${path}`);
        return;
    }

    const fullUrl = `${baseUrl}${path}`;
    const headersWithAuth = airdropToken ? { Authorization: `Bearer ${airdropToken}` } : undefined;
    
    const requestHeaders: Record<string, string> = {
        ...defaultHeaders,
        'Content-Type': 'application/json',
        ...headersWithAuth,
        ...(headers as Record<string, string>),
    };

    // Use native HTTP client for all airdrop API requests (CORS-free, more reliable)
    const isAirdropApiUrl = isConfiguredAirdropDomain(fullUrl);
    if (isAirdropApiUrl) {
        try {
            console.info('Using native HTTP client for airdrop API request');
            return await makeNativeHttpRequest<T>(fullUrl, method, requestHeaders, body);
        } catch (nativeError) {
            console.error('Native HTTP request failed:', nativeError);
            if (onError) {
                onError(nativeError);
            }
            return;
        }
    }

    // For non-airdrop URLs, use fetch (shouldn't happen in current usage)
    try {
        console.warn(`Using fetch for non-airdrop URL: ${fullUrl}`);
        const response = await fetch(fullUrl, {
            method: method,
            headers: requestHeaders,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            console.error(`Error fetching request at ${fullUrl}: `, response);
            if (onError) {
                onError(response);
            }
            return;
        }
        
        return (await response.json()) as T;
    } catch (e) {
        console.error(`Caught error fetching data at ${fullUrl}: `, e);
        if (onError) {
            onError(e);
        }
        return;
    }
}
