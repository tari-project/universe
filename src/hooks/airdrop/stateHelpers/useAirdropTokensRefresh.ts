import { AirdropTokens, useAirdropStore } from '@app/store/useAirdropStore';
import { setAirdropTokens } from '@app/store';

async function refreshAirdropTokens(airdropTokens: AirdropTokens) {
    const airdropApiUrl = useAirdropStore.getState().backendInMemoryConfig?.airdropApiUrl;

    if (!airdropApiUrl) {
        console.error('Error refreshing airdrop tokens. No API URL');
        return;
    }
    try {
        const response = await fetch(`${airdropApiUrl}/auth/local/refresh`, {
            method: 'POST',
            headers: {
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
