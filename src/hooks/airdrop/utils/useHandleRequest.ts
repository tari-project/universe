import { useAirdropStore } from '@app/store/useAirdropStore';
import { handleRefreshAirdropTokens } from '@app/hooks/airdrop/stateHelpers/useAirdropTokensRefresh.ts';
import { useConfigBEInMemoryStore } from '@app/store';
import { defaultHeaders } from '@app/utils';
import { invoke } from '@tauri-apps/api/core';

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
const CIRCUIT_BREAKER_FAILURE_THRESHOLD = 3;
const CIRCUIT_BREAKER_RESET_TIMEOUT = 60000; // 1 minute

let retryCount = 0;

// Circuit breaker state for ut.tari.com
interface CircuitBreakerState {
    failures: number;
    lastFailureTime: number;
    isOpen: boolean;
}

const circuitBreakerState: CircuitBreakerState = {
    failures: 0,
    lastFailureTime: 0,
    isOpen: false,
};

function isCorsError(error: any): boolean {
    const errorMessage = error?.message || error?.toString() || '';
    return (
        errorMessage.includes('CORS') ||
        errorMessage.includes('Cross-Origin') ||
        errorMessage.includes('net::ERR_FAILED') ||
        error?.name === 'TypeError' // Often indicates CORS issues in fetch
    );
}

function shouldUseNativeHttp(url: string): boolean {
    const isUtTariUrl = url.includes('ut.tari.com');
    const now = Date.now();
    
    // Reset circuit breaker if enough time has passed
    if (circuitBreakerState.isOpen && 
        now - circuitBreakerState.lastFailureTime > CIRCUIT_BREAKER_RESET_TIMEOUT) {
        circuitBreakerState.isOpen = false;
        circuitBreakerState.failures = 0;
        console.info('Circuit breaker reset for ut.tari.com');
    }
    
    return isUtTariUrl && circuitBreakerState.isOpen;
}

function recordFailure(): void {
    circuitBreakerState.failures++;
    circuitBreakerState.lastFailureTime = Date.now();
    
    if (circuitBreakerState.failures >= CIRCUIT_BREAKER_FAILURE_THRESHOLD) {
        circuitBreakerState.isOpen = true;
        console.warn(`Circuit breaker opened for ut.tari.com after ${circuitBreakerState.failures} failures`);
    }
}

function recordSuccess(): void {
    if (circuitBreakerState.failures > 0) {
        circuitBreakerState.failures = 0;
        circuitBreakerState.isOpen = false;
        console.info('Circuit breaker reset due to successful request');
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

//  TODO -
//   'un-airdrop" - use RWA language & move request handler
//   added by @shanimal08

export async function handleAirdropRequest<T, B = Record<string, unknown>>({
    body,
    method,
    path,
    onError,
    headers,
    publicRequest,
}: RequestProps<B>) {
    // use useConfigBEInMemoryStore now, not airdrop store for the URL
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

    // Check if we should use native HTTP client
    if (shouldUseNativeHttp(fullUrl)) {
        try {
            console.info('Using native HTTP client due to circuit breaker');
            const result = await makeNativeHttpRequest<T>(fullUrl, method, requestHeaders, body);
            recordSuccess();
            return result;
        } catch (nativeError) {
            console.error('Native HTTP request failed:', nativeError);
            recordFailure();
            if (onError) {
                onError(nativeError);
            }
            return;
        }
    }

    try {
        const response = await fetch(fullUrl, {
            method: method,
            headers: requestHeaders,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            console.error(`Error fetching airdrop request at ${fullUrl}: `, response);
            
            // Record failure for circuit breaker if this is a ut.tari.com request
            if (fullUrl.includes('ut.tari.com')) {
                recordFailure();
            }
            
            if (onError) {
                onError(response);
            }
            return;
        } else {
            // Record success for circuit breaker
            if (fullUrl.includes('ut.tari.com')) {
                recordSuccess();
            }
            return (await response.json()) as T;
        }
    } catch (e) {
        console.error(`Caught error fetching airdrop data at ${fullUrl}: `, e);

        // Check if this is a CORS error and we should try native HTTP
        if (fullUrl.includes('ut.tari.com') && isCorsError(e)) {
            console.warn('CORS error detected, attempting native HTTP fallback');
            recordFailure();
            
            try {
                const result = await makeNativeHttpRequest<T>(fullUrl, method, requestHeaders, body);
                recordSuccess();
                return result;
            } catch (nativeError) {
                console.error('Native HTTP fallback also failed:', nativeError);
                if (onError) {
                    onError(nativeError);
                }
                return;
            }
        }

        // Record failure if this is a ut.tari.com request
        if (fullUrl.includes('ut.tari.com')) {
            recordFailure();
        }

        if (onError) {
            onError(e);
        }
        return;
    }
}
