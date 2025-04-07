import { useEffect } from 'react';
import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest.ts';
import { AirdropTokens, setAirdropTokens, setAuthUuid, setFlareAnimationType, useAirdropStore } from '@app/store';
import { fetchAllUserData } from '@app/store/actions/airdropStoreActions.ts';

export default function useFetchAirdropToken({ canListen = false }: { canListen?: boolean }) {
    const { authUuid, apiUrl } = useAirdropStore((s) => ({
        authUuid: s.authUuid,
        apiUrl: s.backendInMemoryConfig?.airdropApiUrl,
    }));

    useEffect(() => {
        if (!canListen) return;
        if (authUuid && apiUrl) {
            const interval = setInterval(async () => {
                if (authUuid) {
                    try {
                        const tokenResponse = await handleAirdropRequest<AirdropTokens>({
                            path: `/auth/get-token/${authUuid}`,
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        });

                        if (tokenResponse) {
                            clearInterval(interval);
                            await setAirdropTokens(tokenResponse);
                            await fetchAllUserData();

                            if (tokenResponse.installReward) {
                                setFlareAnimationType('FriendAccepted');
                            }
                        }
                    } catch (e) {
                        console.error('Airdrop auth error in useFetchAirdropToken: ', e);
                    }
                }
            }, 2000);
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
    }, [authUuid, apiUrl, canListen]);
}
