import { AirdropTokens, useAirdropStore } from '@app/store/useAirdropStore';
import { useCallback, useEffect } from 'react';
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
    if (!response.ok) {
        throw new Error('Failed to refresh token');
    }

    const data: AirdropTokens = await response.json();
    return data;
}

export function useHandleAirdropTokensRefresh() {
    const { airdropTokens, setAirdropTokens } = useAirdropStore();
    const syncedAidropWithBackend = useAirdropStore((s) => s.syncedWithBackend);

    return useCallback(
        async (airdropApiUrl: string, emit = false) => {
            let fetchedAirdropTokens: AirdropTokens | undefined;
            // 5 hours from now
            const expirationLimit = new Date(new Date().getTime() + 1000 * 60 * 60 * 5);
            const tokenExpirationTime = airdropTokens?.expiresAt && new Date(airdropTokens?.expiresAt * 1000);

            const tokenHasExpired = tokenExpirationTime && tokenExpirationTime < expirationLimit;
            if (airdropTokens && (!syncedAidropWithBackend || tokenHasExpired)) {
                try {
                    fetchedAirdropTokens = await fetchAirdropTokens(airdropApiUrl, airdropTokens);
                } catch (error) {
                    console.error('Error refreshing airdrop tokens:', error);
                }
            }

            if (emit && fetchedAirdropTokens?.token) {
                await currentWindow.emit('startup-token', fetchedAirdropTokens?.token);
            }
            await setAirdropTokens(fetchedAirdropTokens);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [airdropTokens, syncedAidropWithBackend]
    );
}
export function useAirdropTokensRefresh() {
    const { backendInMemoryConfig } = useAirdropStore();

    // Handle refreshing the access token
    const handleRefresh = useHandleAirdropTokensRefresh();

    useEffect(() => {
        if (!backendInMemoryConfig?.airdropApiUrl) return;
        const interval = setInterval(() => handleRefresh(backendInMemoryConfig?.airdropApiUrl), 1000 * 60 * 60);
        return () => clearInterval(interval);
    }, [handleRefresh, backendInMemoryConfig?.airdropApiUrl]);
}
