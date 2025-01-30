import { AirdropTokens, setAirdropTokens, useAirdropStore } from '@app/store/useAirdropStore';
import { useEffect } from 'react';

export async function fetchAirdropTokens(airdropApiUrl: string, airdropTokens: AirdropTokens) {
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

    const data: AirdropTokens = await response.json();
    return data;
}

export async function handleRefreshAirdropTokens(airdropApiUrl: string) {
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
            tokens = await fetchAirdropTokens(airdropApiUrl, airdropTokens);
        } catch (error) {
            console.error('Error refreshing airdrop tokens:', error);
        }
    }
    await setAirdropTokens(tokens);
}
export function useAirdropTokensRefresh() {
    const backendInMemoryConfig = useAirdropStore((s) => s.backendInMemoryConfig);
    useEffect(() => {
        if (!backendInMemoryConfig?.airdropApiUrl) return;
        const interval = setInterval(
            () => handleRefreshAirdropTokens(backendInMemoryConfig?.airdropApiUrl),
            1000 * 60 * 60
        );
        return () => clearInterval(interval);
    }, [backendInMemoryConfig?.airdropApiUrl]);
}
