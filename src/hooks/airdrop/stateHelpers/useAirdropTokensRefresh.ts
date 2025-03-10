import { AirdropTokens, useAirdropStore } from '@app/store/useAirdropStore';
import { setAirdropTokens } from '@app/store';
import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest.ts';

async function fetchAirdropTokens(airdropTokens: AirdropTokens) {
    try {
        const refreshedToken = await handleAirdropRequest<AirdropTokens>({
            path: '/auth/local/refresh',
            headers: {
                'Content-Type': 'application/json',
            },
            method: 'POST',
            body: { refreshToken: airdropTokens.refreshToken },
        });

        if (refreshedToken) {
            return refreshedToken;
        } else {
            console.error('Error refreshing airdrop tokens.');
        }
    } catch (e) {
        console.error('Error refreshing airdrop tokens:', e);
    }
}
export async function handleRefreshAirdropTokens() {
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
            tokens = await fetchAirdropTokens(airdropTokens);
        } catch (error) {
            console.error('Error refreshing airdrop tokens:', error);
        }
    }

    await setAirdropTokens(tokens);
}
