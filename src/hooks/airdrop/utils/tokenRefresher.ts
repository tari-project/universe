import { AirdropTokens } from '@app/store/useAirdropStore';
import { setAirdropTokens } from '@app/store';
import { useConfigBEInMemoryStore } from '@app/store';
import { defaultHeaders } from '@app/utils';
import { invoke } from '@tauri-apps/api/core';

let refreshInFlight: Promise<AirdropTokens | undefined> | null = null;

interface HttpRequest {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
}

interface HttpResponse {
    status: number;
    headers: Record<string, string>;
    body?: any;
    error?: string;
}

async function makeNativeRefreshRequest(refreshToken: string): Promise<AirdropTokens | undefined> {
    const airdropApiUrl = useConfigBEInMemoryStore.getState().airdrop_api_url;
    
    if (!airdropApiUrl) {
        throw new Error('No API URL configured');
    }

    const httpRequest: HttpRequest = {
        url: `${airdropApiUrl}/auth/local/refresh`,
        method: 'POST',
        headers: {
            ...defaultHeaders,
            'Content-Type': 'application/json',
        },
        body: {
            refreshToken,
        },
    };

    console.info('Using native HTTP client for token refresh');
    const response = await invoke<HttpResponse>('http_request_airdrop', { request: httpRequest });

    if (response.error) {
        throw new Error(response.error);
    }

    if (response.status >= 200 && response.status < 300) {
        return response.body as AirdropTokens;
    } else {
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(response.body)}`);
    }
}

/**
 * Thread-safe token refresh that prevents multiple simultaneous refresh attempts
 */
export async function refreshTokensSafely(currentTokens: AirdropTokens): Promise<AirdropTokens | undefined> {
    // If refresh is already in progress, wait for it
    if (refreshInFlight) {
        console.info('Token refresh already in progress, waiting for completion');
        return refreshInFlight;
    }

    console.info('Starting token refresh...');
    refreshInFlight = (async () => {
        try {
            const refreshedTokens = await makeNativeRefreshRequest(currentTokens.refreshToken);
            
            if (refreshedTokens) {
                console.info('Token refresh successful');
                await setAirdropTokens(refreshedTokens);
                return refreshedTokens;
            } else {
                console.error('Token refresh returned no tokens');
                return undefined;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            throw error;
        } finally {
            refreshInFlight = null;
        }
    })();

    return refreshInFlight;
}

/**
 * Check if refresh is currently in progress
 */
export function isRefreshInProgress(): boolean {
    return refreshInFlight !== null;
}

/**
 * Clear any in-flight refresh (for cleanup/reset scenarios)
 */
export function clearRefreshState(): void {
    refreshInFlight = null;
}
