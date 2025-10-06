import { AirdropTokens, useAirdropStore } from '@app/store/useAirdropStore';
import { setAirdropTokens } from '@app/store';
import { defaultHeaders } from '@app/utils';
import { refreshTokensSafely, isRefreshInProgress } from '@app/hooks/airdrop/utils/tokenRefresher';

async function refreshAirdropTokens(airdropTokens: AirdropTokens) {
    const airdropApiUrl = useAirdropStore.getState().backendInMemoryConfig?.airdrop_api_url;

    if (!airdropApiUrl) {
        console.error('Error refreshing airdrop tokens. No API URL');
        return;
    }
    try {
        const response = await fetch(`${airdropApiUrl}/auth/local/refresh`, {
            method: 'POST',
            headers: {
                ...defaultHeaders,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refreshToken: airdropTokens.refreshToken,
            }),
        });
        if (!response.ok) {
            console.error('Fetching airdrop tokens was not successful');
            return undefined;
        }

        const refreshedToken: AirdropTokens = await response.json();

        if (refreshedToken) {
            return refreshedToken;
        } else {
            console.error('Error refreshing airdrop tokens.');
        }
    } catch (e) {
        console.error('Error refreshing airdrop tokens:', e);
    }
}
export async function handleRefreshAirdropTokens(): Promise<AirdropTokens | undefined> {
    const airdropTokens = useAirdropStore.getState().airdropTokens;

    if (!airdropTokens) {
        console.warn('No tokens available for refresh');
        return;
    }

    // Check if refresh is already in progress
    if (isRefreshInProgress()) {
        console.info('Token refresh already in progress, skipping duplicate request');
        return airdropTokens;
    }

    // 5 hours from now
    const expirationLimit = new Date(new Date().getTime() + 1000 * 60 * 60 * 5);
    const tokenExpirationTime = airdropTokens?.expiresAt && new Date(airdropTokens?.expiresAt * 1000);
    const tokenHasExpired = tokenExpirationTime && tokenExpirationTime < expirationLimit;
    
    if (tokenHasExpired) {
        try {
            console.info(`Token expires at ${tokenExpirationTime?.toISOString()}, refreshing...`);
            const refreshedTokens = await refreshTokensSafely(airdropTokens);
            return refreshedTokens;
        } catch (error) {
            console.error('Error refreshing airdrop tokens:', error);
            return airdropTokens; // Return current tokens on error
        }
    }

    return airdropTokens;
}
