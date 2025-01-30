import { useCallback, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-shell';
import { v4 as uuidv4 } from 'uuid';
import { setAirdropTokens, useAirdropStore } from '@app/store/useAirdropStore';

export const useAirdropAuth = () => {
    const { setFlareAnimationType, authUuid, setAuthUuid, backendInMemoryConfig } = useAirdropStore();

    const handleAuth = useCallback(
        (code?: string) => {
            const token = uuidv4();
            if (backendInMemoryConfig?.airdropUrl) {
                setAuthUuid(token);
                open(
                    `${backendInMemoryConfig?.airdropUrl}/auth?tauri=${token}${code ? `&universeReferral=${code}` : ''}`
                );
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [backendInMemoryConfig?.airdropUrl]
    );

    useEffect(() => {
        if (authUuid && backendInMemoryConfig?.airdropApiUrl) {
            const interval = setInterval(() => {
                if (authUuid) {
                    fetch(`${backendInMemoryConfig?.airdropApiUrl}/auth/get-token/${authUuid}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            if (!data.error) {
                                clearInterval(interval);
                                setAirdropTokens(data);
                                if (data.installReward) {
                                    setFlareAnimationType('FriendAccepted');
                                }
                            }
                        });
                }
            }, 1000);
            const timeout = setTimeout(
                () => {
                    clearInterval(interval);
                    setAuthUuid('');
                },
                1000 * 60 * 5
            );

            return () => {
                clearInterval(interval);
                clearTimeout(timeout);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authUuid, backendInMemoryConfig?.airdropApiUrl]);

    return { handleAuth };
};
