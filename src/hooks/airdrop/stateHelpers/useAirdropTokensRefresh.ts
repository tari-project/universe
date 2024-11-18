import { useAirdropStore } from '@app/store/useAirdropStore';
import { useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import * as Sentry from '@sentry/react';

export function useHandleAirdropTokensRefresh() {
    const { airdropTokens, setAirdropTokens } = useAirdropStore();

    return useCallback(
        (airdropApiUrl: string) => {
            // 5 hours from now
            const expirationLimit = new Date(new Date().getTime() + 1000 * 60 * 60 * 5);
            const tokenExpirationTime = airdropTokens?.expiresAt && new Date(airdropTokens?.expiresAt * 1000);

            const tokenHasExpired = tokenExpirationTime && tokenExpirationTime < expirationLimit;
            if (airdropTokens && tokenHasExpired) {
                fetch(`${airdropApiUrl}/auth/local/refresh`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        refreshToken: airdropTokens.refreshToken,
                    }),
                })
                    .then((response) => response.json())
                    .then((data) => {
                        setAirdropTokens(data);
                    });
            }
        },
        [airdropTokens, setAirdropTokens]
    );
}
export function useAirdropTokensRefresh() {
    const { airdropTokens, backendInMemoryConfig } = useAirdropStore();

    // Handle refreshing the access token
    const handleRefresh = useHandleAirdropTokensRefresh();

    useEffect(() => {
        if (!backendInMemoryConfig?.airdropApiUrl) return;
        const interval = setInterval(() => handleRefresh(backendInMemoryConfig?.airdropApiUrl), 1000 * 60 * 60);
        return () => clearInterval(interval);
    }, [handleRefresh, backendInMemoryConfig?.airdropApiUrl]);

    // Handle setting the access token
    useEffect(() => {
        if (!airdropTokens) return;
        invoke('set_airdrop_access_token', { token: airdropTokens?.token }).catch((error) => {
            Sentry.captureException(error);
            console.error('Error getting airdrop tokens', error);
        });
    }, [airdropTokens]);
}
