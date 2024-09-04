import { useAirdropStore } from '@app/store/useAirdropStore';
// import { useInterval } from "../useInterval";
import { useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

export function useAirdropTokensRefresh() {
    const { airdropTokens, setAirdropTokens, backendInMemoryConfig } = useAirdropStore();

    // Handle refreshing the access token
    const handleRefresh = useCallback(
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

    useEffect(() => {
        if (!backendInMemoryConfig?.airdropApiUrl) return;
        const interval = setInterval(handleRefresh, 1000 * 60 * 60, backendInMemoryConfig?.airdropApiUrl);
        return () => clearInterval(interval);
    }, [handleRefresh, backendInMemoryConfig?.airdropApiUrl]);

    // Handle setting the access token
    useEffect(() => {
        if (!airdropTokens) return;
        invoke('set_airdrop_access_token', { token: airdropTokens?.token }).catch((error) => {
            console.error('Error getting airdrop tokens', error);
        });
    }, [airdropTokens]);
}
