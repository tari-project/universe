import { AirdropTokens, setAirdropTokens, useAirdropStore } from '@app/store/useAirdropStore';
import { useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
const currentWindow = getCurrentWindow();
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
    console.debug(response);
    if (!response.ok) {
        throw new Error('Failed to refresh token');
    }

    const data: AirdropTokens = await response.json();
    return data;
}

export async function handleRefreshAirdropTokens(airdropApiUrl: string, emit = false) {
    const airdropTokens = useAirdropStore.getState().airdropTokens;
    const syncedAidropWithBackend = useAirdropStore.getState().syncedWithBackend;
    let fetchedAirdropTokens: AirdropTokens | undefined;
    let startupToken: AirdropTokens['token'] | undefined;
    // 5 hours from now
    const expirationLimit = new Date(new Date().getTime() + 1000 * 60 * 60 * 5);
    const tokenExpirationTime = airdropTokens?.expiresAt && new Date(airdropTokens?.expiresAt * 1000);

    const tokenHasExpired = tokenExpirationTime && tokenExpirationTime < expirationLimit;
    console.debug(airdropTokens);
    console.debug(`tokenHasExpired= ${tokenHasExpired}`);
    console.debug(`syncedAidropWithBackend= ${syncedAidropWithBackend}`);
    if (airdropTokens && (!syncedAidropWithBackend || tokenHasExpired)) {
        try {
            fetchedAirdropTokens = await fetchAirdropTokens(airdropApiUrl, airdropTokens);
            if (fetchedAirdropTokens?.token) {
                startupToken = fetchedAirdropTokens.token;
            }
        } catch (error) {
            console.error('Error refreshing airdrop tokens:', error);
        }
    }

    if (emit && startupToken) {
        console.debug('emitting');
        await currentWindow.emit('startup-token', startupToken);
    }
    await setAirdropTokens(fetchedAirdropTokens);
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
