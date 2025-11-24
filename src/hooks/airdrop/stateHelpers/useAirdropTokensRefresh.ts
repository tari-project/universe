import { AirdropTokens, useAirdropStore } from '@app/store/useAirdropStore';
import { setAirdropTokens } from '@app/store';
import { setTrancheStatus } from '@app/store/actions/airdropStoreActions';
import { defaultHeaders } from '@app/utils';
import type { TrancheStatus } from '@app/types/airdrop-claim';

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
    let tokens: AirdropTokens | undefined = airdropTokens;

    if (!tokens) {
        return;
    }
    // 5 hours from now
    const expirationLimit = new Date(new Date().getTime() + 1000 * 60 * 60 * 5);
    const tokenExpirationTime = airdropTokens?.expiresAt && new Date(airdropTokens?.expiresAt * 1000);
    const tokenHasExpired = tokenExpirationTime && tokenExpirationTime < expirationLimit;
    if (airdropTokens && tokenHasExpired) {
        try {
            tokens = await refreshAirdropTokens(airdropTokens);
        } catch (error) {
            console.error('Error refreshing airdrop tokens:', error);
        }
    }

    await setAirdropTokens(tokens);

    return tokens;
}

// Tranche refresh functionality
async function fetchTrancheStatus(): Promise<TrancheStatus | undefined> {
    const airdropApiUrl = useAirdropStore.getState().backendInMemoryConfig?.airdrop_api_url;
    const airdropToken = useAirdropStore.getState().airdropTokens?.token;

    if (!airdropApiUrl || !airdropToken) {
        console.warn('No API URL or token available for tranche refresh');
        return;
    }

    try {
        const response = await fetch(`${airdropApiUrl}/tari//airdrop/tranches/status`, {
            method: 'GET',
            headers: {
                ...defaultHeaders,
                'Content-Type': 'application/json',
                Authorization: `Bearer ${airdropToken}`,
            },
        });

        if (!response.ok) {
            console.error('Failed to fetch tranche status:', response.status);
            return;
        }

        const result = await response.json();

        if (result?.success && result?.data) {
            return result.data;
        } else {
            console.error('Invalid tranche status response:', result);
        }
    } catch (error) {
        console.error('Error fetching tranche status:', error);
    }
}

export async function handleTrancheRefresh(): Promise<boolean> {
    try {
        const trancheStatus = await fetchTrancheStatus();

        if (trancheStatus) {
            setTrancheStatus(trancheStatus);
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error refreshing tranche status:', error);
        return false;
    }
}

// Combined refresh function for both tokens and tranche data
export async function handleFullAirdropRefresh(): Promise<{
    tokensRefreshed: boolean;
    tranchesRefreshed: boolean;
}> {
    const results = await Promise.allSettled([handleRefreshAirdropTokens(), handleTrancheRefresh()]);

    return {
        tokensRefreshed: results[0].status === 'fulfilled' && !!results[0].value,
        tranchesRefreshed: results[1].status === 'fulfilled' && !!results[1].value,
    };
}
